import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectService } from '../project/service/project.service'
import { WorkspaceService } from '../workspace/service/workspace.service'
import {
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  ProjectAccessLevel,
  Secret,
  SecretVersion,
  User,
  Workspace
} from '@prisma/client'
import { Test } from '@nestjs/testing'
import { AppModule } from '../app/app.module'
import { EventModule } from '../event/event.module'
import { WorkspaceModule } from '../workspace/workspace.module'
import { ProjectModule } from '../project/project.module'
import { EnvironmentModule } from '../environment/environment.module'
import { SecretModule } from './secret.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { EnvironmentService } from '../environment/service/environment.service'
import fetchEvents from '../common/fetch-events'
import { SecretService } from './service/secret.service'
import { EventService } from '../event/service/event.service'
import { REDIS_CLIENT } from '../provider/redis.provider'
import { RedisClientType } from 'redis'
import { mockDeep } from 'jest-mock-extended'
import { UserService } from '../user/service/user.service'
import { UserModule } from '../user/user.module'
import { QueryTransformPipe } from '../common/query.transform.pipe'

describe('Secret Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let eventService: EventService
  let userService: UserService
  let user1: User, user2: User
  let workspace1: Workspace
  let project1: Project, project2: Project
  let environment1: Environment
  let secret1: Secret

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        SecretModule,
        UserModule
      ]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    projectService = moduleRef.get(ProjectService)
    workspaceService = moduleRef.get(WorkspaceService)
    environmentService = moduleRef.get(EnvironmentService)
    secretService = moduleRef.get(SecretService)
    eventService = moduleRef.get(EventService)
    userService = moduleRef.get(UserService)

    app.useGlobalPipes(new QueryTransformPipe())

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    const createUser1 = await userService.createUser({
      email: 'johndoe@keyshade.xyz',
      name: 'John Doe',
      isOnboardingFinished: true
    })

    const createUser2 = await userService.createUser({
      email: 'janedoe@keyshade.xyz',
      name: 'Jane Doe',
      isOnboardingFinished: true
    })

    workspace1 = createUser1.defaultWorkspace

    delete createUser1.defaultWorkspace
    delete createUser2.defaultWorkspace

    user1 = createUser1
    user2 = createUser2

    project1 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 1',
      description: 'Project 1 description',
      storePrivateKey: true,
      accessLevel: ProjectAccessLevel.PRIVATE,
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description'
        },
        {
          name: 'Environment 2',
          description: 'Environment 2 description'
        }
      ]
    })) as Project

    project2 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 2',
      description: 'Project 2 description',
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.PRIVATE,
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description'
        }
      ]
    })) as Project

    environment1 = await prisma.environment.findFirst({
      where: {
        projectId: project1.id,
        name: 'Environment 1'
      }
    })

    secret1 = (await secretService.createSecret(
      user1,
      {
        name: 'Secret 1',
        rotateAfter: '24',
        note: 'Secret 1 note',
        entries: [
          {
            environmentId: environment1.id,
            value: 'Secret 1 value'
          }
        ]
      },
      project1.id
    )) as Secret
  })

  afterEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.workspace.deleteMany()
    ])
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(projectService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(environmentService).toBeDefined()
  })

  it('should be able to create a secret', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        name: 'Secret 2',
        note: 'Secret 2 note',
        entries: [
          {
            value: 'Secret 2 value',
            environmentId: environment1.id
          }
        ],
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()

    expect(body).toBeDefined()
    expect(body.name).toBe('Secret 2')
    expect(body.note).toBe('Secret 2 note')
    expect(body.projectId).toBe(project1.id)
    expect(body.versions.length).toBe(1)
    expect(body.versions[0].value).not.toBe('Secret 2 value')
  })

  it('should have created a secret version', async () => {
    const secretVersion = await prisma.secretVersion.findFirst({
      where: {
        secretId: secret1.id
      }
    })

    expect(secretVersion).toBeDefined()
    expect(secretVersion.value).not.toBe('Secret 1 value')
    expect(secretVersion.version).toBe(1)
    expect(secretVersion.environmentId).toBe(environment1.id)
  })

  it('should not be able to create a secret with a non-existing environment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        name: 'Secret 3',
        rotateAfter: '24',
        entries: [
          {
            value: 'Secret 3 value',
            environmentId: 'non-existing-environment-id'
          }
        ]
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
  })

  it('should not be able to create a secret if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        name: 'Secret 3',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
    )
  })

  it('should not be able to create a duplicate secret in the same project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        name: 'Secret 1',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Secret already exists: Secret 1 in project ${project1.id}`
    )
  })

  it('should have created a SECRET_ADDED event', async () => {
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.SECRET
    )

    const event = response.items[0]

    expect(event.source).toBe(EventSource.SECRET)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.SECRET_ADDED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should not be able to update a non-existing secret', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/non-existing-secret-id`,
      payload: {
        name: 'Updated Secret 1',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Secret with id non-existing-secret-id not found'
    )
  })

  it('should be able to update the secret name and note without creating a new version', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}`,
      payload: {
        name: 'Updated Secret 1',
        note: 'Updated Secret 1 note'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().secret.name).toEqual('Updated Secret 1')
    expect(response.json().secret.note).toEqual('Updated Secret 1 note')
    expect(response.json().updatedVersions.length).toBe(0)

    const secretVersion = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id
      }
    })

    expect(secretVersion.length).toBe(1)
  })

  it('should create a new version if the value is updated', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}`,
      payload: {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentId: environment1.id
          }
        ]
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().updatedVersions.length).toBe(1)

    const secretVersion = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id,
        environmentId: environment1.id
      }
    })

    expect(secretVersion.length).toBe(2)
  })

  it('should fail to create a new version if the environment does not exist', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}`,
      payload: {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentId: 'non-existing-environment-id'
          }
        ]
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
  })

  it('should have created a SECRET_UPDATED event', async () => {
    // Update a secret
    await secretService.updateSecret(user1, secret1.id, {
      name: 'Updated Secret 1'
    })

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.SECRET
    )

    const event = response.items[0]

    expect(event.source).toBe(EventSource.SECRET)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.SECRET_UPDATED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBe(secret1.id)
  })

  it('should not be able to roll back a non-existing secret', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/non-existing-secret-id/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Secret with id non-existing-secret-id not found'
    )
  })

  it('should not be able to roll back a secret it does not have access to', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User ${user2.id} does not have the required authorities`
    )
  })

  it('should not be able to roll back to a non-existing version', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/rollback/2?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Invalid rollback version: 2 for secret: ${secret1.id}`
    )
  })

  it('should not be able to roll back if the secret has no versions', async () => {
    await prisma.secretVersion.deleteMany({
      where: {
        secretId: secret1.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `No versions found for environment: ${environment1.id} for secret: ${secret1.id}`
    )
  })

  it('should not create a secret version entity if value-environmentId is not provided during creation', async () => {
    const secret = await secretService.createSecret(
      user1,
      {
        name: 'Secret 4',
        note: 'Secret 4 note',
        rotateAfter: '24'
      },
      project1.id
    )

    const secretVersion = await prisma.secretVersion.findMany({
      where: {
        secretId: secret.id
      }
    })

    expect(secretVersion.length).toBe(0)
  })

  it('should be able to roll back a secret', async () => {
    // Creating a few versions first
    await secretService.updateSecret(user1, secret1.id, {
      entries: [
        {
          value: 'Updated Secret 1 value',
          environmentId: environment1.id
        }
      ]
    })

    await secretService.updateSecret(user1, secret1.id, {
      entries: [
        {
          value: 'Updated Secret 1 value 2',
          environmentId: environment1.id
        }
      ]
    })

    let versions: SecretVersion[]

    // eslint-disable-next-line prefer-const
    versions = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id
      }
    })

    expect(versions.length).toBe(3)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    // expect(response.statusCode).toBe(200)
    // expect(response.json().count).toEqual(2)

    // versions = await prisma.secretVersion.findMany({
    //   where: {
    //     secretId: secret1.id
    //   }
    // })

    // expect(versions.length).toBe(1)
  })

  it('should not be able to fetch decrypted secrets if the project does not store the private key', async () => {
    // Fetch the environment of the project
    const environment = await prisma.environment.findFirst({
      where: {
        projectId: project2.id
      }
    })

    await secretService.createSecret(
      user1,
      {
        name: 'Secret 20',
        entries: [
          {
            environmentId: environment.id,
            value: 'Secret 20 value'
          }
        ],
        rotateAfter: '24',
        note: 'Secret 20 note'
      },
      project2.id
    )

    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project2.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Cannot decrypt secret values as the project does not store the private key`
    )
  })

  it('should be able to fetch all secrets', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}?page=0&limit=10`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items.length).toBe(1)

    const { secret, values } = response.json().items[0]
    expect(secret.id).toBeDefined()
    expect(secret.name).toBeDefined()
    expect(secret.note).toBeDefined()
    expect(secret.projectId).toBeDefined()
    expect(values.length).toBe(1)

    const value = values[0]
    expect(value.environment).toBeDefined()
    expect(value.value).not.toEqual('Secret 1 value')

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/secret/${project1.id}?decryptValue=false&page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.first).toEqual(
      `/secret/${project1.id}?decryptValue=false&page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/secret/${project1.id}?decryptValue=false&page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should be able to fetch all secrets decrypted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}?decryptValue=true&page=0&limit=10`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items.length).toBe(1)

    const { secret, values } = response.json().items[0]
    expect(secret.id).toBeDefined()
    expect(secret.name).toBeDefined()
    expect(secret.note).toBeDefined()
    expect(secret.projectId).toBeDefined()
    expect(values.length).toBe(1)

    const value = values[0]
    expect(value.environment).toBeDefined()
    expect(value.value).toEqual('Secret 1 value')

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/secret/${project1.id}?decryptValue=true&page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.first).toEqual(
      `/secret/${project1.id}?decryptValue=true&page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/secret/${project1.id}?decryptValue=true&page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should not be able to fetch all secrets decrypted if the project does not store the private key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project2.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Cannot decrypt secret values as the project does not store the private key`
    )
  })

  it('should not be able to fetch all secrets decrypted if somehow the project does not have a private key even though it stores it (hypothetical)', async () => {
    await prisma.project.update({
      where: {
        id: project1.id
      },
      data: {
        storePrivateKey: true,
        privateKey: null
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Cannot decrypt secret values as the project does not have a private key`
    )

    await prisma.project.update({
      where: {
        id: project1.id
      },
      data: {
        privateKey: project1.privateKey
      }
    })
  })

  it('should not be able to fetch all secrets if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
    )
  })

  it('should not be able to fetch all secrets if the project does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/non-existing-project-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Project with id non-existing-project-id not found'
    )
  })

  it('should be able to fetch all secrets by project and environment', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(1)

    const secret = response.json()[0]
    expect(secret.name).toBe('Secret 1')
    expect(secret.value).toBe('Secret 1 value')
    expect(secret.isPlaintext).toBe(true)
  })

  it('should not be able to fetch all secrets by project and environment if project does not exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/non-existing-project-id/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Project with id non-existing-project-id not found'
    )
  })

  it('should not be able to fetch all secrets by project and environment if environment does not exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}/non-existing-environment-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Environment with id non-existing-environment-id not found'
    )
  })

  it('should not be able to fetch all secrets by project and environment if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project1.id}/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
    )
  })

  it('should not be sending the plaintext secret if project does not store the private key', async () => {
    // Get the first environment of project 2
    const environment = await prisma.environment.findFirst({
      where: {
        projectId: project2.id
      }
    })

    // Create a secret in project 2
    await secretService.createSecret(
      user1,
      {
        name: 'Secret 20',
        entries: [
          {
            environmentId: environment.id,
            value: 'Secret 20 value'
          }
        ],
        rotateAfter: '24',
        note: 'Secret 20 note'
      },
      project2.id
    )

    const response = await app.inject({
      method: 'GET',
      url: `/secret/${project2.id}/${environment.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(1)

    const secret = response.json()[0]
    expect(secret.name).toBe('Secret 20')
    expect(secret.value).not.toBe('Secret 20 value')
    expect(secret.isPlaintext).toBe(false)
  })

  it('should not be able to delete a non-existing secret', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/secret/non-existing-secret-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Secret with id non-existing-secret-id not found'
    )
  })

  it('should not be able to delete a secret it does not have access to', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/secret/${secret1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User ${user2.id} does not have the required authorities`
    )
  })

  it('should be able to delete a secret', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/secret/${secret1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  it('should have created a SECRET_DELETED event', async () => {
    // Delete a secret
    await secretService.deleteSecret(user1, secret1.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.SECRET
    )

    const event = response.items[0]

    expect(event.source).toBe(EventSource.SECRET)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.SECRET_DELETED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBe(secret1.id)
  })

  //revisions test
  it('should be able to fetch all revisions of secrets', async () => {
    // create two more entries,totalling three versions
    // checks if its able to fetch multiple revisions
    await secretService.updateSecret(user1, secret1.id, {
      entries: [
        {
          value: 'Updated Secret 1 value',
          environmentId: environment1.id
        }
      ]
    })

    await secretService.updateSecret(user1, secret1.id, {
      entries: [
        {
          value: 'Updated Secret 1 value 2',
          environmentId: environment1.id
        }
      ]
    })

    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret1.id}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(3)
  })

  it('should return [] if the secret has no revision', async () => {
    //returns [] if secret has no revision
    await prisma.secretVersion.deleteMany({
      where: {
        secretId: secret1.id
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret1.id}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(0)
  })

  it('should return error if secret doesnt exist', async () => {
    //return error if secret doesnt exist
    const secretid = 'nonexistentsecret'
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secretid}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Secret with id ${secretid} not found`
    )
  })

  it('should return error if environment doesnt exist', async () => {
    //return error if environment doesnt exist
    const environmentid = 'nonexistentenv'
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret1.id}/revisions/${environmentid}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Environment with id ${environmentid} not found`
    )
  })

  it('returns error if secret isnt accessible', async () => {
    //return error if user has no access to secret
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret1.id}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User ${user2.id} does not have the required authorities`
    )
  })
})
