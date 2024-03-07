import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { AppModule } from '../app/app.module'
import { EnvironmentModule } from '../environment/environment.module'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectModule } from '../project/project.module'
import { SecretModule } from '../secret/secret.module'
import { WorkspaceModule } from '../workspace/workspace.module'
import { ApprovalModule } from './approval.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { ProjectService } from '../project/service/project.service'
import { WorkspaceService } from '../workspace/service/workspace.service'
import { EnvironmentService } from '../environment/service/environment.service'
import { SecretService } from '../secret/service/secret.service'
import cleanUp from '../common/cleanup'
import { v4 } from 'uuid'
import {
  Approval,
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
  Authority,
  Environment,
  Project,
  Secret,
  User,
  Variable,
  Workspace
} from '@prisma/client'
import { VariableService } from '../variable/service/variable.service'
import { VariableModule } from '../variable/variable.module'
import { UserModule } from '../user/user.module'
import { WorkspaceRoleService } from '../workspace-role/service/workspace-role.service'
import { WorkspaceRoleModule } from '../workspace-role/workspace-role.module'

describe('Approval Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService

  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let variableService: VariableService
  let workspaceRoleService: WorkspaceRoleService

  let workspace1: Workspace
  let project1: Project
  let environment1: Environment
  let variable1: Variable
  let secret1: Secret

  let user1: User, user2: User, user3: User

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        UserModule,
        ApprovalModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        SecretModule,
        VariableModule,
        WorkspaceRoleModule
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
    variableService = moduleRef.get(VariableService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    await cleanUp(prisma)

    const user1Id = v4(),
      user2Id = v4()

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

    user3 = await prisma.user.create({
      data: {
        id: v4(),
        email: 'abc@keyshade.xyz',
        name: 'ABC',
        isOnboardingFinished: true
      }
    })

    workspace1 = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 1',
      description: 'Workspace 1 description',
      approvalEnabled: true
    })
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(projectService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(environmentService).toBeDefined()
    expect(secretService).toBeDefined()
    expect(variableService).toBeDefined()
  })

  it('should create an approval to update a workspace with approval enabled', async () => {
    const approval = (await workspaceService.updateWorkspace(
      user1,
      workspace1.id,
      {
        name: 'Workspace 1 Updated'
      }
    )) as Approval

    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.PENDING)
    expect(approval.action).toBe(ApprovalAction.UPDATE)
    expect(approval.itemType).toBe(ApprovalItemType.WORKSPACE)
    expect(approval.workspaceId).toBe(workspace1.id)
    expect(approval.metadata).toStrictEqual({
      name: 'Workspace 1 Updated'
    })
  })

  it('should allow user with WORKSPACE_ADMIN to view the approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const adminRole = await prisma.workspaceRole.findUnique({
      where: {
        workspaceId_name: {
          name: 'Admin',
          workspaceId: workspace1.id
        }
      }
    })

    expect(adminRole).toBeDefined()

    await prisma.workspaceMember.create({
      data: {
        userId: user3.id,
        workspaceId: workspace1.id,
        invitationAccepted: true,
        roles: {
          create: {
            roleId: adminRole.id
          }
        }
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user3.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
  })

  it('should allow user with MANAGE_APPROVALS authority to view the approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const managerRole = await workspaceRoleService.createWorkspaceRole(
      user1,
      workspace1.id,
      {
        name: 'Manager',
        authorities: [Authority.MANAGE_APPROVALS]
      }
    )

    await workspaceService.updateMemberRoles(user1, workspace1.id, user3.id, [
      managerRole.id
    ])

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
  })

  it('should should not be able to approve an approval with invalid id', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/approval/abc/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toBe('Approval with id abc does not exist')
  })

  it('should not allow non member to approve an approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toBe(
      `User with id ${user2.id} is not authorized to view approval with id ${approval.id}`
    )
  })

  it('should allow updating the approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}?reason=updated`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toBe(approval.id)
    expect(response.json().status).toBe(ApprovalStatus.PENDING)
    expect(response.json().reason).toBe('updated')
  })

  it('should update the workspace if the approval is approved', async () => {
    let approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const updatedWorkspace = await workspaceService.getWorkspaceById(
      user1,
      workspace1.id
    )

    expect(updatedWorkspace.name).toBe('Workspace 1 Updated')

    approval = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })

    expect(approval.status).toBe(ApprovalStatus.APPROVED)
    expect(approval.approvedById).toBe(user1.id)
    expect(approval.approvedAt).toBeDefined()

    workspace1 = updatedWorkspace
  })

  it('should not be able to approve an already approved approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.APPROVED,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe(
      `Approval with id ${approval.id} is already approved/rejected`
    )
  })

  it('should not be able to reject an already approved approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.APPROVED,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/reject`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe(
      `Approval with id ${approval.id} is already approved/rejected`
    )
  })

  it('should create an approval if a project is created', async () => {
    const result = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Project 1'
      },
      'Test reason'
    )) as {
      approval: Approval
      project: Project
    }

    const approval = result.approval
    const project = result.project

    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.PENDING)
    expect(approval.itemType).toBe(ApprovalItemType.PROJECT)
    expect(approval.action).toBe(ApprovalAction.CREATE)
    expect(approval.workspaceId).toBe(workspace1.id)
    expect(approval.metadata).toStrictEqual({})

    expect(project).toBeDefined()
    expect(project.id).toBeDefined()
    expect(project.name).toBe('Project 1')
    expect(project.pendingCreation).toBe(true)
  })

  it('should delete the project if the approval is deleted', async () => {
    let approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.PROJECT
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const projectCount = await prisma.project.count({
      where: { workspaceId: workspace1.id }
    })
    expect(projectCount).toBe(0)

    approval = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })
    expect(approval).toBeNull()
  })

  it('should allow creating project with the same name till it is not approved', async () => {
    const result1 = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Project 1'
      },
      'Test reason'
    )) as {
      approval: Approval
      project: Project
    }

    const result2 = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Project 1'
      },
      'Test reason'
    )) as {
      approval: Approval
      project: Project
    }

    expect(result1.approval).toBeDefined()
    expect(result1.project).toBeDefined()
    expect(result2.approval).toBeDefined()
    expect(result2.project).toBeDefined()
  })

  it('should create a new project if the approval is approved', async () => {
    let approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.PROJECT
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const projectCount = await prisma.project.count({
      where: { workspaceId: workspace1.id, pendingCreation: false }
    })
    expect(projectCount).toBe(1)

    approval = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })

    expect(approval.status).toBe(ApprovalStatus.APPROVED)
    expect(approval.approvedById).toBe(user1.id)
    expect(approval.approvedAt).toBeDefined()
  })

  it('should not approve an approval if the project with the same name already exists', async () => {
    let approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.PROJECT
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().message).toBe(
      `Project with this name Project 1 already exists`
    )

    approval = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })
    expect(approval.status).toBe(ApprovalStatus.PENDING)

    // Change the project name to something else
    project1 = await prisma.project.update({
      where: {
        id: approval.itemId
      },
      data: {
        name: 'Project 2'
      }
    })
  })

  it('should not create an approval if an environment is added to a project pending creation', async () => {
    const result = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 1',
        description: 'Environment 1 description',
        isDefault: true
      },
      project1.id
    )) as Environment

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Environment 1')
    expect(result.description).toBe('Environment 1 description')

    environment1 = result
  })

  it('should not create an approval if a variable is added to an environment pending creation', async () => {
    const result = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY',
        value: 'VALUE'
      },
      project1.id
    )) as Variable

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('KEY')

    variable1 = result
  })

  it('should not create an approval if a secret is added to a project pending creation', async () => {
    const result = (await secretService.createSecret(
      user1,
      {
        name: 'Secret 1',
        value: 'Secret 1 value'
      },
      project1.id
    )) as Secret

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Secret 1')

    secret1 = result
  })

  it('should not create an approval if a secret pending creation is updated', async () => {
    const result = (await secretService.updateSecret(user1, secret1.id, {
      name: 'Secret 1 Updated'
    })) as Secret

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Secret 1 Updated')

    secret1 = result
  })

  it('should not create an approval if a variable pending creation is updated', async () => {
    const result = (await variableService.updateVariable(user1, variable1.id, {
      name: 'KEY_UPDATED'
    })) as Variable

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('KEY_UPDATED')

    variable1 = result
  })

  it('should not create an approval if an environment pending creation is updated', async () => {
    const result = (await environmentService.updateEnvironment(
      user1,
      {
        name: 'Environment 1 Updated'
      },
      environment1.id
    )) as Environment

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Environment 1 Updated')

    environment1 = result
  })

  it('should not create an approval if the project pending creation is updated', async () => {
    const result = (await projectService.updateProject(user1, project1.id, {
      name: 'Project 2 Updated'
    })) as Project

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Project 2 Updated')
  })

  it('should not create an approval if a secret pending creation is deleted', async () => {
    const result = await secretService.deleteSecret(user1, secret1.id)

    expect(result).toBeUndefined()
    secret1 = undefined
  })

  it('should not create an approval if a variable pending creation is deleted', async () => {
    const result = await variableService.deleteVariable(user1, variable1.id)

    expect(result).toBeUndefined()
    variable1 = undefined
  })

  it('should not create an approval if an environment pending creation is deleted', async () => {
    // Create a default environment before deleting the pending creation
    const createEnvResult = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 2',
        description: 'Environment 2 description',
        isDefault: true
      },
      project1.id
    )) as Environment

    const result = await environmentService.deleteEnvironment(
      user1,
      environment1.id
    )

    expect(result).toBeUndefined()

    environment1 = createEnvResult
  })

  it('should approve all the sub items if a project is approved', async () => {
    secret1 = (await secretService.createSecret(
      user1,
      {
        name: 'Secret 2',
        value: 'Secret 2 value'
      },
      project1.id
    )) as Secret

    variable1 = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY2',
        value: 'VALUE2'
      },
      project1.id
    )) as Variable

    environment1 = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 3',
        description: 'Default description',
        isDefault: true
      },
      project1.id
    )) as Environment

    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemId: project1.id
      }
    })
    expect(approval).not.toBeNull()

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const project = await prisma.project.findUnique({
      where: {
        id: approval.itemId
      }
    })
    expect(project.pendingCreation).toBe(false)
    project1 = project

    const environment = await prisma.environment.findUnique({
      where: {
        id: environment1.id
      }
    })
    expect(environment.pendingCreation).toBe(false)
    environment1 = environment

    const variable = await prisma.variable.findUnique({
      where: {
        id: variable1.id
      }
    })
    expect(variable.pendingCreation).toBe(false)
    variable1 = variable

    const secret = await prisma.secret.findUnique({
      where: {
        id: secret1.id
      }
    })
    expect(secret.pendingCreation).toBe(false)
    secret1 = secret
  })

  it('should create an approval if a secret is updated', async () => {
    const result = (await secretService.updateSecret(user1, secret1.id, {
      name: 'Secret 2 Updated',
      value: 'Secret 2 value updated'
    })) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.SECRET)
    expect(result.action).toBe(ApprovalAction.UPDATE)
    expect(result.metadata).toStrictEqual({
      name: 'Secret 2 Updated',
      value: expect.not.stringContaining('Secret 2 value updated')
    })
  })

  it('should create an approval if a variable is updated', async () => {
    const result = (await variableService.updateVariable(user1, variable1.id, {
      name: 'KEY2_UPDATED',
      value: 'VALUE2_UPDATED'
    })) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.VARIABLE)
    expect(result.action).toBe(ApprovalAction.UPDATE)
    expect(result.metadata).toStrictEqual({
      name: 'KEY2_UPDATED',
      value: 'VALUE2_UPDATED'
    })
  })

  it('should create an approval if the environment of a variable is updated', async () => {
    const result = (await variableService.updateVariable(user1, variable1.id, {
      environmentId: environment1.id
    })) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.VARIABLE)
    expect(result.action).toBe(ApprovalAction.UPDATE)
    expect(result.metadata).toStrictEqual({
      environmentId: environment1.id
    })
  })

  it('should create an approval if the environment of a secret is updated', async () => {
    const result = (await secretService.updateSecret(user1, secret1.id, {
      environmentId: environment1.id
    })) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.SECRET)
    expect(result.action).toBe(ApprovalAction.UPDATE)
    expect(result.metadata).toStrictEqual({
      environmentId: environment1.id
    })
  })

  it('should create an approval if a secret is rolled back', async () => {
    await prisma.secretVersion.create({
      data: {
        secretId: secret1.id,
        value: 'Secret 2 value rolled back',
        version: 2
      }
    })

    const result = (await secretService.rollbackSecret(
      user1,
      secret1.id,
      1
    )) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.SECRET)
    expect(result.action).toBe(ApprovalAction.UPDATE)
    expect(result.metadata).toStrictEqual({
      rollbackVersion: 1
    })
  })

  it('should create an approval if a variable is rolled back', async () => {
    await prisma.variableVersion.create({
      data: {
        variableId: variable1.id,
        value: 'VALUE2 rolled back',
        version: 2
      }
    })

    const result = (await variableService.rollbackVariable(
      user1,
      variable1.id,
      1
    )) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.VARIABLE)
    expect(result.action).toBe(ApprovalAction.UPDATE)
    expect(result.metadata).toStrictEqual({
      rollbackVersion: 1
    })
  })

  it('should update the secret if the approval is approved', async () => {
    const approvals = await prisma.approval.findMany({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.SECRET,
        action: ApprovalAction.UPDATE,
        itemId: secret1.id
      }
    })

    for (const approval of approvals) {
      const response = await app.inject({
        method: 'PUT',
        url: `/approval/${approval.id}/approve`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    }

    const secret = await prisma.secret.findUnique({
      where: {
        id: secret1.id
      },
      include: {
        versions: true
      }
    })
    expect(secret.name).toBe('Secret 2 Updated')
    expect(secret.versions.length).toBe(1)
    expect(secret.environmentId).toBe(environment1.id)
  })

  it('should update the variable if the approval is approved', async () => {
    const approvals = await prisma.approval.findMany({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.VARIABLE,
        action: ApprovalAction.UPDATE,
        itemId: variable1.id
      }
    })

    for (const approval of approvals) {
      const response = await app.inject({
        method: 'PUT',
        url: `/approval/${approval.id}/approve`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    }

    const variable = await prisma.variable.findUnique({
      where: {
        id: variable1.id
      },
      include: {
        versions: true
      }
    })
    expect(variable.name).toBe('KEY2_UPDATED')
    expect(variable.versions.length).toBe(1)
    expect(variable.environmentId).toBe(environment1.id)
  })

  it('should create an approval if a secret is deleted', async () => {
    const result = (await secretService.deleteSecret(
      user1,
      secret1.id
    )) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.SECRET)
    expect(result.action).toBe(ApprovalAction.DELETE)
  })

  it('should create an approval if a variable is deleted', async () => {
    const result = (await variableService.deleteVariable(
      user1,
      variable1.id
    )) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.VARIABLE)
    expect(result.action).toBe(ApprovalAction.DELETE)
  })

  it('should delete the secret if the approval is approved', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.SECRET,
        action: ApprovalAction.DELETE,
        itemId: secret1.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const secret = await prisma.secret.findUnique({
      where: {
        id: secret1.id
      }
    })
    expect(secret).toBeNull()
  })

  it('should delete the variable if the approval is approved', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.VARIABLE,
        action: ApprovalAction.DELETE,
        itemId: variable1.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const variable = await prisma.variable.findUnique({
      where: {
        id: variable1.id
      }
    })
    expect(variable).toBeNull()
  })

  it('should create an approval if a secret is created', async () => {
    const result = (await secretService.createSecret(
      user1,
      {
        name: 'Secret 3',
        value: 'Secret 3 value',
        environmentId: environment1.id
      },
      project1.id
    )) as {
      approval: Approval
      secret: Secret
    }

    const approval = result.approval
    const secret = result.secret

    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.PENDING)
    expect(approval.itemType).toBe(ApprovalItemType.SECRET)
    expect(approval.action).toBe(ApprovalAction.CREATE)
    expect(approval.workspaceId).toBe(workspace1.id)
    expect(approval.metadata).toStrictEqual({})
    expect(secret).toBeDefined()
    expect(secret.id).toBeDefined()
    expect(secret.name).toBe('Secret 3')

    secret1 = secret
  })

  it('should create an approval if a variable is created', async () => {
    const result = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY3',
        value: 'VALUE3'
      },
      project1.id
    )) as {
      approval: Approval
      variable: Variable
    }

    const approval = result.approval
    const variable = result.variable

    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.PENDING)
    expect(approval.itemType).toBe(ApprovalItemType.VARIABLE)
    expect(approval.action).toBe(ApprovalAction.CREATE)
    expect(approval.workspaceId).toBe(workspace1.id)
    expect(approval.metadata).toStrictEqual({})
    expect(variable).toBeDefined()
    expect(variable.id).toBeDefined()
    expect(variable.name).toBe('KEY3')

    variable1 = variable
  })

  it('should delete the approval if the secret is deleted', async () => {
    const secret = await prisma.secret.findUnique({
      where: {
        id: secret1.id
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/secret/${secret.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const approval = await prisma.approval.findFirst({
      where: {
        itemId: secret.id
      }
    })
    expect(approval).toBeNull()
  })

  it('should delete the approval if the variable is deleted', async () => {
    const variable = await prisma.variable.findUnique({
      where: {
        id: variable1.id
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/variable/${variable.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const approval = await prisma.approval.findFirst({
      where: {
        itemId: variable.id
      }
    })
    expect(approval).toBeNull()
  })

  it('should create an approval if an environment is deleted', async () => {
    await prisma.environment.create({
      data: {
        name: 'Environment 5',
        description: 'Environment 2 description',
        isDefault: true,
        projectId: project1.id
      }
    })

    await prisma.environment.update({
      where: {
        id: environment1.id
      },
      data: {
        isDefault: false
      }
    })

    const result = (await environmentService.deleteEnvironment(
      user1,
      environment1.id
    )) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.ENVIRONMENT)
    expect(result.action).toBe(ApprovalAction.DELETE)
  })

  it('should delete the environment if the approval is approved', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        itemId: environment1.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const environment = await prisma.environment.findUnique({
      where: {
        id: environment1.id
      }
    })
    expect(environment).toBeNull()
  })

  it('should create an approval if an environment is created', async () => {
    const result = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 4',
        description: 'Environment 4 description',
        isDefault: true
      },
      project1.id
    )) as {
      approval: Approval
      environment: Environment
    }

    const approval = result.approval
    const environment = result.environment

    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.PENDING)
    expect(approval.itemType).toBe(ApprovalItemType.ENVIRONMENT)
    expect(approval.action).toBe(ApprovalAction.CREATE)
    expect(approval.workspaceId).toBe(workspace1.id)
    expect(approval.metadata).toStrictEqual({})
    expect(environment).toBeDefined()
    expect(environment.id).toBeDefined()
    expect(environment.name).toBe('Environment 4')

    environment1 = environment
  })

  it('should not create an approval if a secret is added to an environment pending creation', async () => {
    const result = (await secretService.createSecret(
      user1,
      {
        name: 'Secret 4',
        value: 'Secret 4 value',
        environmentId: environment1.id
      },
      project1.id
    )) as Secret

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Secret 4')

    secret1 = result
  })

  it('should not create an approval if a variable is added to an environment pending creation', async () => {
    const result = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY4',
        value: 'VALUE4'
      },
      project1.id
    )) as Variable

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.name).toBe('KEY4')

    variable1 = result
  })

  it('should approve the child items of an environment if the environment is approved', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.ENVIRONMENT,
        itemId: environment1.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const secret = await prisma.secret.findUnique({
      where: {
        id: secret1.id
      }
    })
    expect(secret.pendingCreation).toBe(false)

    const variable = await prisma.variable.findUnique({
      where: {
        id: variable1.id
      }
    })
    expect(variable.pendingCreation).toBe(false)
  })

  it('should create an approval if a project is deleted', async () => {
    const result = (await projectService.deleteProject(
      user1,
      project1.id
    )) as Approval

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.status).toBe(ApprovalStatus.PENDING)
    expect(result.itemType).toBe(ApprovalItemType.PROJECT)
    expect(result.action).toBe(ApprovalAction.DELETE)
  })

  it('should delete the project if the approval is approved', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        itemId: project1.id,
        itemType: ApprovalItemType.PROJECT,
        action: ApprovalAction.DELETE,
        status: ApprovalStatus.PENDING
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const project = await prisma.project.findUnique({
      where: {
        id: project1.id
      }
    })
    expect(project).toBeNull()
  })

  it('should be able to delete an approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const deletedApproval = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })
    expect(deletedApproval).toBeNull()
  })

  it('should be able to fetch all approvals of a workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/approval/${workspace1.id}/all-in-workspace`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).not.toBe(0)
  })

  it('should have the project if project approval is fetched', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        itemType: ApprovalItemType.PROJECT
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
    expect(response.json().project).toBeDefined()
  })

  it('should have the environment if environment approval is fetched', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        itemType: ApprovalItemType.ENVIRONMENT
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
    expect(response.json().environment).toBeDefined()
  })

  it('should have the secret if secret approval is fetched', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        itemType: ApprovalItemType.SECRET
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
    expect(response.json().secret).toBeDefined()
  })

  it('should have the variable if variable approval is fetched', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        itemType: ApprovalItemType.VARIABLE
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
    expect(response.json().variable).toBeDefined()
  })

  it('should have the workspace if workspace approval is fetched', async () => {
    await workspaceService.updateWorkspace(user1, workspace1.id, {
      name: 'Workspace 10 Updated'
    })

    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        itemType: ApprovalItemType.WORKSPACE
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/approval/${approval.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().approval.id).toBe(approval.id)
    expect(response.json().workspace).toBeDefined()
  })

  it('should be able to fetch all approvals of a user in a workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/approval/${workspace1.id}/all-by-user/${user1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().length).not.toBe(0)
  })

  it('should be able to reject an approval', async () => {
    const approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/reject`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  it('should delete the item if the approval is rejected', async () => {
    // Create a new project
    const result = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Project 2'
      },
      'Test reason'
    )) as {
      approval: Approval
      project: Project
    }

    const approval = result.approval
    const project = result.project

    expect(approval).toBeDefined()
    expect(project).toBeDefined()

    // Reject the approval
    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/reject`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const approvalAfterRejection = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })

    expect(approvalAfterRejection.status).toBe(ApprovalStatus.REJECTED)

    // Project should be deleted
    const deletedProject = await prisma.project.findUnique({
      where: {
        id: project.id
      }
    })
    expect(deletedProject).toBeNull()
  })

  it('should update a project if the approval is accepted', async () => {
    const createProjectResponse = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Project 3'
      },
      'Test reason'
    )) as {
      approval: Approval
      project: Project
    }

    const approval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.PROJECT,
        action: ApprovalAction.CREATE,
        itemId: createProjectResponse.project.id
      }
    })

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    await projectService.updateProject(
      user1,
      createProjectResponse.project.id,
      {
        name: 'Project 3 Updated'
      }
    )

    const updateProjectApproval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.PROJECT,
        action: ApprovalAction.UPDATE,
        itemId: createProjectResponse.project.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${updateProjectApproval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const project = await prisma.project.findUnique({
      where: {
        id: createProjectResponse.project.id
      }
    })
    expect(project.name).toBe('Project 3 Updated')

    project1 = project
  })

  it('should update an environment if approval is accepted', async () => {
    const createEnvResponse = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 6',
        description: 'Environment 6 description',
        isDefault: true
      },
      project1.id
    )) as {
      approval: Approval
      environment: Environment
    }

    const approval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.ENVIRONMENT,
        action: ApprovalAction.CREATE,
        itemId: createEnvResponse.environment.id
      }
    })

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    await environmentService.updateEnvironment(
      user1,
      {
        name: 'Environment 6 Updated'
      },
      createEnvResponse.environment.id
    )

    const updateEnvApproval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.ENVIRONMENT,
        action: ApprovalAction.UPDATE,
        itemId: createEnvResponse.environment.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${updateEnvApproval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const environment = await prisma.environment.findUnique({
      where: {
        id: createEnvResponse.environment.id
      }
    })
    expect(environment.name).toBe('Environment 6 Updated')

    environment1 = environment
  })

  it('should approve a secret if the approval is approved', async () => {
    const createSecretResponse = (await secretService.createSecret(
      user1,
      {
        name: 'Secret 5',
        value: 'Secret 5 value'
      },
      project1.id
    )) as {
      approval: Approval
      secret: Secret
    }

    let approval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.SECRET,
        action: ApprovalAction.CREATE,
        itemId: createSecretResponse.secret.id
      }
    })

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    approval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.APPROVED,
        itemType: ApprovalItemType.SECRET,
        action: ApprovalAction.CREATE,
        itemId: createSecretResponse.secret.id
      }
    })

    const secret = await prisma.secret.findUnique({
      where: {
        id: createSecretResponse.secret.id
      }
    })

    expect(secret.pendingCreation).toBe(false)
    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.APPROVED)

    secret1 = secret
  })

  it('should approve a variable if the approval is approved', async () => {
    const createVariableResponse = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY5',
        value: 'VALUE5'
      },
      project1.id
    )) as {
      approval: Approval
      variable: Variable
    }

    let approval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.VARIABLE,
        action: ApprovalAction.CREATE,
        itemId: createVariableResponse.variable.id
      }
    })

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    approval = await prisma.approval.findFirst({
      where: {
        status: ApprovalStatus.APPROVED,
        itemType: ApprovalItemType.VARIABLE,
        action: ApprovalAction.CREATE,
        itemId: createVariableResponse.variable.id
      }
    })

    const variable = await prisma.variable.findUnique({
      where: {
        id: createVariableResponse.variable.id
      }
    })

    expect(variable.pendingCreation).toBe(false)
    expect(approval).toBeDefined()
    expect(approval.id).toBeDefined()
    expect(approval.status).toBe(ApprovalStatus.APPROVED)

    variable1 = variable
  })

  it('should throw error if the environment to which a variable is to be transferred is deleted before the approval is accepted', async () => {
    const createEnvResponse = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 7',
        description: 'Environment 7 description'
      },
      project1.id
    )) as {
      approval: Approval
      environment: Environment
    }

    const approval = createEnvResponse.approval

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    const updateVariableEnvironmentResponse =
      (await variableService.updateVariableEnvironment(
        user1,
        variable1.id,
        createEnvResponse.environment.id
      )) as Approval

    await prisma.environment.delete({
      where: {
        id: createEnvResponse.environment.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${updateVariableEnvironmentResponse.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should throw error if the environment to which a secret is to be transferred is deleted before the approval is accepted', async () => {
    const createEnvResponse = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 8',
        description: 'Environment 8 description'
      },
      project1.id
    )) as {
      approval: Approval
      environment: Environment
    }

    const approval = createEnvResponse.approval

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    const updateSecretEnvironmentResponse =
      (await secretService.updateSecretEnvironment(
        user1,
        secret1.id,
        createEnvResponse.environment.id
      )) as Approval

    await prisma.environment.delete({
      where: {
        id: createEnvResponse.environment.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${updateSecretEnvironmentResponse.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should not approve an environment approval if the environment with the same name already exists', async () => {
    const createEnvResponse = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 9',
        description: 'Environment 9 description'
      },
      project1.id
    )) as {
      approval: Approval
      environment: Environment
    }

    const createEnvResponse2 = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 9',
        description: 'Environment 9 description'
      },
      project1.id
    )) as {
      approval: Approval
      environment: Environment
    }

    const approval = createEnvResponse.approval

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    const approval2 = createEnvResponse2.approval

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval2.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
  })

  it('should not approve a variable if the variable with the same name already exists in the environment', async () => {
    const createVariableResponse = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY6',
        value: 'VALUE6'
      },
      project1.id
    )) as {
      approval: Approval
      variable: Variable
    }

    const createVariableResponse2 = (await variableService.createVariable(
      user1,
      {
        environmentId: environment1.id,
        name: 'KEY6',
        value: 'VALUE6'
      },
      project1.id
    )) as {
      approval: Approval
      variable: Variable
    }

    const approval = createVariableResponse.approval

    await app.inject({
      method: 'PUT',
      url: `/approval/${approval.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    const approval2 = createVariableResponse2.approval

    const response = await app.inject({
      method: 'PUT',
      url: `/approval/${approval2.id}/approve`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
