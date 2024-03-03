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

  let workspace1: Workspace, workspace2: Workspace
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

    workspace2 = await workspaceService.createWorkspace(user2, {
      name: 'Workspace 2',
      description: 'Workspace 2 description',
      approvalEnabled: false
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

  it('should not allow creating another approval if there is a pending approval for the same workspace', async () => {
    try {
      await workspaceService.updateWorkspace(user1, workspace1.id, {
        name: 'Workspace 1 Updated Again'
      })
    } catch (error) {
      expect(error.message).toBe(
        `Active approval for WORKSPACE with id ${workspace1.id} already exists`
      )
    }
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
    expect(response.json().id).toBe(approval.id)
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
    expect(response.json().id).toBe(approval.id)
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

  it('should delete the project if the approval is rejected', async () => {
    let approval = await prisma.approval.findFirst({
      where: {
        workspaceId: workspace1.id,
        status: ApprovalStatus.PENDING,
        itemType: ApprovalItemType.PROJECT
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

    const projectCount = await prisma.project.count({
      where: { workspaceId: workspace1.id }
    })
    expect(projectCount).toBe(0)

    approval = await prisma.approval.findUnique({
      where: {
        id: approval.id
      }
    })

    console.log(approval)

    expect(approval).toBeDefined()
    // expect(approval.status).toBe(ApprovalStatus.REJECTED)
    expect(approval.rejectedById).toBe(user1.id)
    expect(approval.rejectedAt).toBeDefined()
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
