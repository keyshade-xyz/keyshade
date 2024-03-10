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
  Workspace
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
import cleanUp from '../common/cleanup'
import { EnvironmentService } from '../environment/service/environment.service'
import { v4 } from 'uuid'
import fetchEvents from '../common/fetch-events'
import { VariableService } from './service/variable.service'
import { EventService } from '../event/service/event.service'

describe('Variable Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let variableService: VariableService
  let eventService: EventService

  let user1: User, user2: User
  let workspace1: Workspace, workspace2: Workspace
  let project1: Project, project2: Project, workspace2Project: Project
  let environment1: Environment,
    environment2: Environment,
    workspace2Environment: Environment
  let variable1: Variable

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        VariableModule
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
    variableService = moduleRef.get(VariableService)
    eventService = moduleRef.get(EventService)

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

    workspace2Environment = await prisma.environment.findFirst({
      where: {
        projectId: workspace2Project.id,
        name: 'Environment 1'
      }
    })

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
        environmentId: environment2.id,
        name: 'Variable 1',
        value: 'Variable 1 value',
        note: 'Variable 1 note',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()

    expect(body).toBeDefined()
    expect(body.name).toBe('Variable 1')
    expect(body.note).toBe('Variable 1 note')
    expect(body.environmentId).toBe(environment2.id)
    expect(body.projectId).toBe(project1.id)

    variable1 = body
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

  it('should create variable in default environment if environmentId is not provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        name: 'Variable 2',
        value: 'Variable 2 value',
        note: 'Variable 2 note',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()

    expect(body).toBeDefined()
    expect(body.name).toBe('Variable 2')
    expect(body.note).toBe('Variable 2 note')
    expect(body.environmentId).toBe(environment1.id)
    expect(body.projectId).toBe(project1.id)
  })

  it('should not be able to create a variable with a non-existing environment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        environmentId: 'non-existing-environment-id',
        name: 'Variable 3',
        value: 'Variable 3 value',
        rotateAfter: '24'
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
        value: 'Variable 3 value',
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
    await prisma.environment.updateMany({
      where: {
        projectId: project1.id,
        name: 'Environment 1'
      },
      data: {
        isDefault: false
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        name: 'Variable 4',
        value: 'Variable 4 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      `No default environment found for project with id ${project1.id}`
    )

    await prisma.environment.updateMany({
      where: {
        projectId: project1.id,
        name: 'Environment 1'
      },
      data: {
        isDefault: true
      }
    })
  })

  it('should not be able to create a duplicate variable in the same environment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/variable/${project1.id}`,
      payload: {
        environmentId: environment2.id,
        name: 'Variable 1',
        value: 'Variable 1 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Variable already exists: Variable 1 in environment ${environment2.id} in project ${project1.id}`
    )
  })

  it('should have created a VARIABLE_ADDED event', async () => {
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.VARIABLE
    )

    const event = response[0]

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
        value: 'Updated Variable 1 value',
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

  it('should not be able to update a variable with same name in the same environment', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}`,
      payload: {
        name: 'Variable 1',
        value: 'Updated Variable 1 value',
        rotateAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Variable already exists: Variable 1 in environment ${environment2.id}`
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
    expect(response.json().name).toEqual('Updated Variable 1')
    expect(response.json().note).toEqual('Updated Variable 1 note')

    const variableVersion = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(variableVersion.length).toBe(1)

    variable1 = response.json()
  })

  it('should create a new version if the value is updated', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}`,
      payload: {
        value: 'Updated Variable 1 value'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const variableVersion = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(variableVersion.length).toBe(2)
  })

  it('should have created a VARIABLE_UPDATED event', async () => {
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.VARIABLE
    )

    const event = response[0]

    expect(event.source).toBe(EventSource.VARIABLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.VARIABLE_UPDATED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should be able to update the environment of a variable', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/environment/${environment1.id}`,
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
      url: `/variable/${variable1.id}/environment/non-existing-environment-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
  })

  it('should not be able to move to an environment in another project', async () => {
    const otherEnvironment = await prisma.environment.findFirst({
      where: {
        projectId: project2.id,
        name: 'Environment 1'
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/environment/${otherEnvironment.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Environment ${otherEnvironment.id} does not belong to the same project ${project1.id}`
    )
  })

  it('should not be able to move the variable to the same environment', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/environment/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toEqual(
      `Can not update the environment of the variable to the same environment: ${environment1.id}`
    )
  })

  it('should not be able to move the variable if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/environment/${workspace2Environment.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User ${user1.id} does not have the required authorities`
    )
  })

  it('should not be able to move a variable of the same name to an environment', async () => {
    const newVariable = await prisma.variable.create({
      data: {
        projectId: project1.id,
        environmentId: environment2.id,
        name: 'Updated Variable 1'
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${newVariable.id}/environment/${environment1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toEqual(
      `Variable already exists: Updated Variable 1 in environment ${environment1.id} in project ${project1.id}`
    )
  })

  it('should not be able to roll back a non-existing variable', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/variable/non-existing-variable-id/rollback/1`,
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
      url: `/variable/${variable1.id}/rollback/1`,
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
      url: `/variable/${variable1.id}/rollback/2`,
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
      value: 'Updated Variable 1 value'
    })

    await variableService.updateVariable(user1, variable1.id, {
      value: 'Updated Variable 1 value 2'
    })

    let versions: VariableVersion[]

    versions = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(versions.length).toBe(4)

    const response = await app.inject({
      method: 'PUT',
      url: `/variable/${variable1.id}/rollback/1`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().count).toEqual(3)

    versions = await prisma.variableVersion.findMany({
      where: {
        variableId: variable1.id
      }
    })

    expect(versions.length).toBe(1)
  })

  it('should not be able to fetch a non existing variable', async () => {
    const response = await app.inject({
      method: 'GET',
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

  it('should not be able to fetch a variable it does not have access to', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User ${user2.id} does not have the required authorities`
    )
  })

  it('should be able to fetch a variable', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toEqual(variable1.id)

    const versions = await response.json().versions

    expect(versions.length).toBe(1)
    expect(versions[0].value).toEqual('Variable 1 value') // Variable should be in encrypted form until specified otherwise
  })

  it('should be able to fetch a variable', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/${variable1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toEqual(variable1.id)

    const versions = await response.json().versions

    expect(versions.length).toBe(1)
    expect(versions[0].value).toEqual('Variable 1 value')
  })

  it('should be able to fetch all variables', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/all/${project1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).toBe(3)
  })

  it('should not be able to fetch all variables if the user has no access to the project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/all/${project1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toEqual(
      `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
    )
  })

  it('should not be able to fetch all variables if the project does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/variable/all/non-existing-project-id`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toEqual(
      'Project with id non-existing-project-id not found'
    )
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
    expect(response.json().message).toEqual(
      `User ${user2.id} does not have the required authorities`
    )
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
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.VARIABLE
    )

    const event = response[0]

    expect(event.source).toBe(EventSource.VARIABLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.VARIABLE_DELETED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  afterAll(async () => {
    await app.close()
  })
})
