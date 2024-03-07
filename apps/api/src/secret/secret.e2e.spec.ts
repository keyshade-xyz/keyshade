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
import cleanUp from '../common/cleanup'
import { EnvironmentService } from '../environment/service/environment.service'
import { v4 } from 'uuid'
import fetchEvents from '../common/fetch-events'
import { SecretService } from './service/secret.service'

describe('Secret Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let secretService: SecretService

  let user1: User, user2: User
  let workspace1: Workspace, workspace2: Workspace
  let project1: Project, project2: Project, workspace2Project: Project
  let environment1: Environment,
    environment2: Environment,
    workspace2Environment: Environment
  let secret1: Secret

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        SecretModule
      ]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    projectService = moduleRef.get(ProjectService)
    workspaceService = moduleRef.get(WorkspaceService)
    environmentService = moduleRef.get(EnvironmentService)
    secretService = moduleRef.get(SecretService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    await cleanUp(prisma)

    const user1Id = v4()
    const user2Id = v4()

    user1 = await prisma.user.create({
      data: {
        id: user1Id,
        email: 'johndoe@keyshade.xyz',
        name: 'John Doe',
        isOnboardingFinished: true
      }
    })

    user2 = await prisma.user.create({
      data: {
        id: user2Id,
        email: 'janedoe@keyshade.xyz',
        name: 'Jane Doe',
        isOnboardingFinished: true
      }
    })

    workspace1 = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 1',
      description: 'Workspace 1 description',
      approvalEnabled: false
    })

    workspace2 = await workspaceService.createWorkspace(user2, {
      name: 'Workspace 2',
      description: 'Workspace 2 description',
      approvalEnabled: false
    })

    project1 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 1',
      description: 'Project 1 description',
      storePrivateKey: true,
      isPublic: false,
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description',
          isDefault: true
        },
        {
          name: 'Environment 2',
          description: 'Environment 2 description',
          isDefault: false
        }
      ]
    })) as Project

    project2 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 2',
      description: 'Project 2 description',
      storePrivateKey: false,
      isPublic: false,
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description',
          isDefault: true
        }
      ]
    })) as Project

    workspace2Project = (await projectService.createProject(
      user2,
      workspace2.id,
      {
        name: 'Workspace 2 Project',
        description: 'Workspace 2 Project description',
        storePrivateKey: true,
        isPublic: false,
        environments: [
          {
            name: 'Environment 1',
            description: 'Environment 1 description',
            isDefault: true
          }
        ]
      }
    )) as Project

    workspace2Environment = await prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId: workspace2Project.id,
          name: 'Environment 1'
        }
      }
    })

    environment1 = await prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId: project1.id,
          name: 'Environment 1'
        }
      }
    })

    environment2 = await prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId: project1.id,
          name: 'Environment 2'
        }
      }
    })
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
        environmentId: environment2.id,
        name: 'Secret 1',
        note: 'Secret 1 note',
        value: 'Secret 1 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()

    expect(body).toBeDefined()
    expect(body.name).toBe('Secret 1')
    expect(body.note).toBe('Secret 1 note')
    expect(body.environmentId).toBe(environment2.id)
    expect(body.projectId).toBe(project1.id)

    secret1 = body
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
  })

  it('should create secret in default environment if environmentId is not provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        name: 'Secret 2',
        value: 'Secret 2 value',
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
    expect(body.environmentId).toBe(environment1.id)
    expect(body.projectId).toBe(project1.id)
  })

  it('should not be able to create a secret with a non-existing environment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        environmentId: 'non-existing-environment-id',
        name: 'Secret 3',
        value: 'Secret 3 value',
        rotateAfter: '24'
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
        value: 'Secret 3 value',
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

  it('should fail if project has no default environment(hypothetical case)', async () => {
    await prisma.environment.update({
      where: {
        projectId_name: {
          projectId: project1.id,
          name: 'Environment 1'
        }
      },
      data: {
        isDefault: false
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        name: 'Secret 4',
        value: 'Secret 4 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `No default environment found for project: ${project1.id}`
    )

    await prisma.environment.update({
      where: {
        projectId_name: {
          projectId: project1.id,
          name: 'Environment 1'
        }
      },
      data: {
        isDefault: true
      }
    })
  })

  it('should not be able to create a duplicate secret in the same environment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/secret/${project1.id}`,
      payload: {
        environmentId: environment2.id,
        name: 'Secret 1',
        value: 'Secret 1 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Secret already exists: Secret 1 in environment ${environment2.name} in project ${project1.id}`
    )
  })

  // it('should have created a SECRET_ADDED event', async () => {
  //   const response = await fetchEvents(app, user1, 'secretId=' + secret1.id)

  //   const event = {
  //     id: expect.any(String),
  //     title: expect.any(String),
  //     description: expect.any(String),
  //     source: EventSource.SECRET,
  //     triggerer: EventTriggerer.USER,
  //     severity: EventSeverity.INFO,
  //     type: EventType.SECRET_ADDED,
  //     timestamp: expect.any(String),
  //     metadata: expect.any(Object)
  //   }

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json()).toEqual(expect.arrayContaining([event]))
  // })

  it('should not be able to update a non-existing secret', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/non-existing-secret-id`,
      payload: {
        name: 'Updated Secret 1',
        value: 'Updated Secret 1 value',
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

  it('should not be able to update a secret with same name in the same environment', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}`,
      payload: {
        name: 'Secret 1',
        value: 'Updated Secret 1 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Secret already exists: Secret 1 in environment ${environment2.id}`
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
    expect(response.json().name).toEqual('Updated Secret 1')
    expect(response.json().note).toEqual('Updated Secret 1 note')

    const secretVersion = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id
      }
    })

    expect(secretVersion.length).toBe(1)

    secret1 = response.json()
  })

  it('should create a new version if the value is updated', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}`,
      payload: {
        value: 'Updated Secret 1 value'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const secretVersion = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id
      }
    })

    expect(secretVersion.length).toBe(2)
  })

  // it('should have created a SECRET_UPDATED event', async () => {
  //   const response = await fetchEvents(app, user1, 'secretId=' + secret1.id)

  //   const event = {
  //     id: expect.any(String),
  //     title: expect.any(String),
  //     description: expect.any(String),
  //     source: EventSource.SECRET,
  //     triggerer: EventTriggerer.USER,
  //     severity: EventSeverity.INFO,
  //     type: EventType.SECRET_UPDATED,
  //     timestamp: expect.any(String),
  //     metadata: expect.any(Object)
  //   }

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json()).toEqual(expect.arrayContaining([event]))
  // })

  it('should be able to update the environment of a secret', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/environment/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().environmentId).toBe(environment1.id)
  })

  it('should not be able to move to a non-existing environment', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/environment/non-existing-environment-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
  })

  it('should not be able to move to an environment in another project', async () => {
    const otherEnvironment = await prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId: project2.id,
          name: 'Environment 1'
        }
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/environment/${otherEnvironment.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Environment ${otherEnvironment.id} does not belong to project ${project1.id}`
    )
  })

  it('should not be able to move the secret to the same environment', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/environment/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Can not update the environment of the secret to the same environment: ${environment1.id} in project ${project1.id}`
    )
  })

  it('should not be able to move the secret if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/environment/${workspace2Environment.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User ${user1.id} does not have the required authorities`
    )
  })

  // it('should have created a SECRET_UPDATED event', async () => {
  //   const response = await fetchEvents(app, user1, 'secretId=' + secret1.id)

  //   const event = {
  //     id: expect.any(String),
  //     title: expect.any(String),
  //     description: expect.any(String),
  //     source: EventSource.SECRET,
  //     triggerer: EventTriggerer.USER,
  //     severity: EventSeverity.INFO,
  //     type: EventType.SECRET_UPDATED,
  //     timestamp: expect.any(String),
  //     metadata: expect.any(Object)
  //   }

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json()).toEqual(expect.arrayContaining([event]))
  // })

  it('should not be able to move a secret of the same name to an environment', async () => {
    const newSecret = await prisma.secret.create({
      data: {
        projectId: project1.id,
        environmentId: environment2.id,
        name: 'Updated Secret 1'
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${newSecret.id}/environment/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Secret already exists: Updated Secret 1 in environment ${environment1.id} in project ${project1.id}`
    )
  })

  it('should not be able to roll back a non-existing secret', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/secret/non-existing-secret-id/rollback/1`,
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
      url: `/secret/${secret1.id}/rollback/1`,
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
      url: `/secret/${secret1.id}/rollback/2`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Invalid rollback version: 2 for secret: ${secret1.id}`
    )
  })

  it('should be able to roll back a secret', async () => {
    // Creating a few versions first
    await secretService.updateSecret(user1, secret1.id, {
      value: 'Updated Secret 1 value'
    })

    await secretService.updateSecret(user1, secret1.id, {
      value: 'Updated Secret 1 value 2'
    })

    let versions: SecretVersion[]

    versions = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id
      }
    })

    expect(versions.length).toBe(4)

    const response = await app.inject({
      method: 'PUT',
      url: `/secret/${secret1.id}/rollback/1`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().count).toEqual(3)

    versions = await prisma.secretVersion.findMany({
      where: {
        secretId: secret1.id
      }
    })

    expect(versions.length).toBe(1)
  })

  it('should not be able to fetch a non existing secret', async () => {
    const response = await app.inject({
      method: 'GET',
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

  it('should not be able to fetch a secret it does not have access to', async () => {
    const response = await app.inject({
      method: 'GET',
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

  it('should be able to fetch a secret', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toEqual(secret1.id)

    const versions = await response.json().versions

    expect(versions.length).toBe(1)
    expect(versions[0].value).not.toEqual('Secret 1 value') // Secret should be in encrypted form until specified otherwise
  })

  it('should be able to fetch a decrypted secret', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret1.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toEqual(secret1.id)

    const versions = await response.json().versions

    expect(versions.length).toBe(1)
    expect(versions[0].value).toEqual('Secret 1 value')
  })

  it('should not be able to fetch a decrypted secret if the project does not store the private key', async () => {
    const secret = (await secretService.createSecret(
      user1,
      {
        environmentId: environment1.id,
        name: 'Secret 20',
        value: 'Secret 20 value',
        rotateAfter: '24',
        note: 'Secret 20 note'
      },
      project2.id
    )) as Secret

    const response = await app.inject({
      method: 'GET',
      url: `/secret/${secret.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Cannot decrypt secret value: ${secret.id} as the project does not store the private key`
    )
  })

  it('should not be able to fetch a decrypted secret if somehow the project does not have a private key even though it stores it (hypothetical)', async () => {
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
      url: `/secret/${secret1.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Cannot decrypt secret value: ${secret1.id} as the project does not have a private key`
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

  it('should be able to fetch all secrets', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/all/${project1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(3)
  })

  it('should be able to fetch all secrets decrypted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/all/${project1.id}?decryptValue=true`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(3)

    const secret = response.json()[0]

    expect(secret.versions[0].value).toEqual('Secret 2 value')
  })

  it('should not be able to fetch all secrets decrypted if the project does not store the private key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secret/all/${project2.id}?decryptValue=true`,
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
      url: `/secret/all/${project1.id}?decryptValue=true`,
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
      url: `/secret/all/${project1.id}`,
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
      url: `/secret/all/non-existing-project-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Project with id non-existing-project-id not found'
    )
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

  afterAll(async () => {
    await app.close()
  })
})
