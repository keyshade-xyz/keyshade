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
  Variable,
  VariableVersion,
  User,
  Workspace,
  ProjectAccessLevel
} from '@prisma/client'
import { Test } from '@nestjs/testing'
import { AppModule } from '../app/app.module'
import { EventModule } from '../event/event.module'
import { WorkspaceModule } from '../workspace/workspace.module'
import { ProjectModule } from '../project/project.module'
import { EnvironmentModule } from '../environment/environment.module'
import { VariableModule } from './variable.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { EnvironmentService } from '../environment/service/environment.service'
import fetchEvents from '../common/fetch-events'
import { VariableService } from './service/variable.service'
import { EventService } from '../event/service/event.service'
import { REDIS_CLIENT } from '../provider/redis.provider'
import { mockDeep } from 'jest-mock-extended'
import { RedisClientType } from 'redis'
import { UserService } from '../user/service/user.service'
import { UserModule } from '../user/user.module'
import { QueryTransformPipe } from '../common/query.transform.pipe'

describe('Variable Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let variableService: VariableService
  let eventService: EventService
  let userService: UserService

  let user1: User, user2: User
  let workspace1: Workspace
  let project1: Project
  let environment1: Environment
  let environment2: Environment
  let variable1: Variable

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        VariableModule,
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
    variableService = moduleRef.get(VariableService)
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

    environment1 = await prisma.environment.findFirst({
      where: {
        projectId: project1.id,
        name: 'Environment 1'
      }
    })

    environment2 = await prisma.environment.findFirst({
      where: {
        projectId: project1.id,
        name: 'Environment 2'
      }
    })

    variable1 = (await variableService.createVariable(
      user1,
      {
        name: 'Variable 1',
        entries: [
          {
            environmentId: environment1.id,
            value: 'Variable 1 value'
          }
        ]
      },
      project1.id
    )) as Variable
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

  it('should be able to create a variable', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        name: 'Variable 3',
        note: 'Variable 3 note',
        rotateAfter: '24',
        entries: [
          {
            value: 'Variable 3 value',
            environmentId: environment2.id
          }
        ]
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()

    expect(body).toBeDefined()
    expect(body.name).toBe('Variable 3')
    expect(body.note).toBe('Variable 3 note')
    expect(body.projectId).toBe(project1.id)
    expect(body.versions.length).toBe(1)
    expect(body.versions[0].value).toBe('Variable 3 value')

    const variable = await prisma.variable.findUnique({
      where: {
        id: body.id
      }
    })

    expect(variable).toBeDefined()
  })

  it('should have created a variable version', async () => {
    const variableVersion = await prisma.variableVersion.findFirst({
      where: {
        variableId: variable1.id
      }
    })

    expect(variableVersion).toBeDefined()
    expect(variableVersion.value).toBe('Variable 1 value')
    expect(variableVersion.version).toBe(1)
  })

  it('should not be able to create a variable with a non-existing environment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        name: 'Variable 3',
        rotateAfter: '24',
        entries: [
          {
            value: 'Variable 3 value',
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

  it('should not be able to create a variable if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        name: 'Variable 3',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to create a duplicate variable in the same project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        name: 'Variable 1',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Variable already exists: Variable 1 in project ${project1.id}`
    )
  })

  it('should have created a VARIABLE_ADDED event', async () => {
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.VARIABLE
    )

    const event = response.items[0]

    expect(event.source).toBe(EventSource.VARIABLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.VARIABLE_ADDED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should not be able to update a non-existing variable', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/non-existing-variable-id`,
      payload: {
        name: 'Updated Variable 1',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Variable with id non-existing-variable-id not found'
    )
  })

  it('should not be able to update a variable with same name in the same project', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}`,
      payload: {
        name: 'Variable 1',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Variable already exists: Variable 1 in project ${project1.id}`
    )
  })

  it('should be able to update the variable name and note without creating a new version', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}`,
      payload: {
        name: 'Updated Variable 1',
        note: 'Updated Variable 1 note'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().variable.name).toEqual('Updated Variable 1')
    expect(response.json().variable.note).toEqual('Updated Variable 1 note')
    expect(response.json().updatedVersions.length).toEqual(0)

    const variableVersion = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(variableVersion.length).toBe(1)
  })

  it('should create a new version if the value is updated', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}`,
      payload: {
        entries: [
          {
            value: 'Updated Variable 1 value',
            environmentId: environment1.id
          }
        ]
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().updatedVersions.length).toEqual(1)

    const variableVersion = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id,
        environmentId: environment1.id
      }
    })

    expect(variableVersion.length).toBe(2)
  })

  it('should fail to create a new version if the environment does not exist', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}`,
      payload: {
        entries: [
          {
            value: 'Updated Variable 1 value',
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

  it('should have created a VARIABLE_UPDATED event', async () => {
    // Update a variable
    await variableService.updateVariable(user1, variable1.id, {
      name: 'Updated Variable 1'
    })

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.VARIABLE
    )

    const event = response.items[0]

    expect(event.source).toBe(EventSource.VARIABLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.VARIABLE_UPDATED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should not be able to roll back a non-existing variable', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/non-existing-variable-id/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Variable with id non-existing-variable-id not found'
    )
  })

  it('should not be able to roll back a variable it does not have access to', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to roll back to a non-existing version', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/rollback/2?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Invalid rollback version: 2 for variable: ${variable1.id}`
    )
  })

  it('should be able to roll back a variable', async () => {
    // Creating a few versions first
    await variableService.updateVariable(user1, variable1.id, {
      entries: [
        {
          value: 'Updated Variable 1 value',
          environmentId: environment1.id
        }
      ]
    })

    await variableService.updateVariable(user1, variable1.id, {
      entries: [
        {
          value: 'Updated Variable 1 value 2',
          environmentId: environment1.id
        }
      ]
    })

    let versions: VariableVersion[]

    versions = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(versions.length).toBe(3)

    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().count).toEqual(2)

    versions = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(versions.length).toBe(1)
  })

  it('should not be able to roll back if the variable has no versions', async () => {
    await prisma.variableVersion.deleteMany({
      where: {
        variableId: variable1.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/rollback/1?environmentId=${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `No versions found for environment: ${environment1.id} for variable: ${variable1.id}`
    )
  })

  it('should not create a variable version entity if value-environmentId is not provided during creation', async () => {
    const variable = await variableService.createVariable(
      user1,
      {
        name: 'Var 3',
        note: 'Var 3 note'
      },
      project1.id
    )

    const variableVersions = await prisma.variableVersion.findMany({
      where: {
        variableId: variable.id
      }
    })

    expect(variableVersions.length).toBe(0)
  })

  it('should be able to fetch all variables', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${project1.id}?page=0&limit=10`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items.length).toBe(1)

    const { variable, values } = response.json().items[0]
    expect(variable).toBeDefined()
    expect(values).toBeDefined()
    expect(values.length).toBe(1)
    expect(values[0].value).toBe('Variable 1 value')
    expect(values[0].environment.id).toBe(environment1.id)
    expect(variable.id).toBe(variable1.id)
    expect(variable.name).toBe('Variable 1')

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/variable/${project1.id}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.first).toEqual(
      `/variable/${project1.id}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/variable/${project1.id}?page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should not be able to fetch all variables if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${project1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to fetch all variables if the project does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/non-existing-project-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Project with id non-existing-project-id not found'
    )
  })

  it('should be able to fetch all variables by project and environment', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${project1.id}/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(1)

    const variable = response.json()[0]
    expect(variable.name).toBe('Variable 1')
    expect(variable.value).toBe('Variable 1 value')
    expect(variable.isPlaintext).toBe(true)
  })

  it('should not be able to fetch all variables by project and environment if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${project1.id}/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to fetch all variables by project and environment if the project does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/non-existing-project-id/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Project with id non-existing-project-id not found'
    )
  })

  it('should not be able to fetch all variables by project and environment if the environment does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${project1.id}/non-existing-environment-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
  })

  it('should not be able to delete a non-existing variable', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/variable/non-existing-variable-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Variable with id non-existing-variable-id not found'
    )
  })

  it('should not be able to delete a variable it does not have access to', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/variable/${variable1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to delete a variable', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/variable/${variable1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  it('should have created a VARIABLE_DELETED event', async () => {
    // Delete a variable
    await variableService.deleteVariable(user1, variable1.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.VARIABLE
    )

    const event = response.items[0]

    expect(event.source).toBe(EventSource.VARIABLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.VARIABLE_DELETED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  //revisions test
  it('should be able to fetch all revisions of variables', async () => {
    // create two more entries,totalling three versions
    // checks if its able to fetch multiple revisions
    await variableService.updateVariable(user1, variable1.id, {
      entries: [
        {
          value: 'Updated Variable 1 value',
          environmentId: environment1.id
        }
      ]
    })

    await variableService.updateVariable(user1, variable1.id, {
      entries: [
        {
          value: 'Updated variable 1 value 2',
          environmentId: environment1.id
        }
      ]
    })

    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(3)
  })

  it('should return [] if the variable has no revision', async () => {
    //returns [] if variable has no revision
    await prisma.variableVersion.deleteMany({
      where: {
        variableId: variable1.id
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(0)
  })

  it('should return error if variable doesnt exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/9999/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(`Variable with id 9999 not found`)
  })

  it('should return error if environment does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}/revisions/9999`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `Environment with id 9999 not found`
    )
  })

  it('returns error if variable is not accessible', async () => {
    //return error if user has no access to variable
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}/revisions/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
  })
})
