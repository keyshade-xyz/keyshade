import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { Project, ProjectRole, User } from '@prisma/client'
import {
  CreateProject,
  ProjectMemberDTO
} from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { ProjectPermission } from '../misc/project.permission'
import {
  IProjectRepository,
  PROJECT_REPOSITORY
} from '../repository/interface.repository'
import {
  ENVIRONMENT_REPOSITORY,
  IEnvironmentRepository
} from '../../environment/repository/interface.repository'
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../user/repository/interface.repository'
import {
  IResendService,
  RESEND_SERVICE
} from '../../resend/services/resend.service.interface'
import { CurrentUser } from '../../decorators/user.decorator'
import { JwtService } from '@nestjs/jwt'
import { createKeyPair } from '../../common/create-key-pair'
import { excludeFields } from '../../common/exclude-fields'

@Injectable()
export class ProjectService {
  private readonly log: Logger = new Logger(ProjectService.name)

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(ENVIRONMENT_REPOSITORY)
    private readonly environmentRepository: IEnvironmentRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(RESEND_SERVICE) private readonly resendService: IResendService,
    private readonly jwt: JwtService,
    private readonly permission: ProjectPermission
  ) {}

  async createProject(user: User, dto: CreateProject): Promise<Project> {
    // Check if project with this name already exists for the user
    if (await this.projectRepository.projectExists(dto.name, user.id))
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
      )

    // Create the public and private key pair
    const { publicKey, privateKey } = createKeyPair()

    const data: Partial<Project> = {
      name: dto.name,
      description: dto.description,
      storePrivateKey: dto.storePrivateKey,
      publicKey
    }

    // Check if the private key should be stored
    // PLEASE DON'T STORE YOUR PRIVATE KEYS WITH US!!
    if (dto.storePrivateKey) {
      data.privateKey = privateKey
    }

    // Create and return the project
    const newProject = await this.projectRepository.createProject(data, user.id)
    // Create and assign the environments providedd in the request, if any
    // or create a default environment
    if (dto.environments && dto.environments.length > 0) {
      let defaultEnvironmentExists = false
      for (const environment of dto.environments) {
        defaultEnvironmentExists =
          defaultEnvironmentExists || environment.isDefault

        const env = await this.environmentRepository.createEnvironment(
          {
            name: environment.name,
            description: environment.description,
            isDefault: defaultEnvironmentExists ? environment.isDefault : false // We don't want more than one default environment
          },
          newProject.id,
          user.id
        )

        this.log.debug(`Created environment ${env} for project ${newProject}`)
      }
    } else {
      const defaultEnvironment = this.environmentRepository.createEnvironment(
        {
          name: 'Default',
          description: 'Default environment for the project',
          isDefault: true
        },
        newProject.id,
        user.id
      )

      this.log.debug(
        `Created default environment ${defaultEnvironment} for project ${newProject}`
      )
    }

    // Add users to the project if any
    if (dto.members && dto.members.length > 0) {
      this.addMembersToProject(newProject, user, dto.members)
    }

    this.log.debug(`Created project ${newProject}`)
    // It is important that we log before the private key is set
    // in order to not log the private key
    newProject.privateKey = privateKey

    return newProject
  }

  async updateProject(
    user: User,
    projectId: Project['id'],
    dto: UpdateProject
  ): Promise<Project> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if project with this name already exists for the user
    if (
      dto.name &&
      (await this.projectRepository.projectExists(dto.name, user.id))
    )
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
      )

    // Check if the user has the permission to update the project
    this.permission.canUpdateProject(user, projectId)

    const data: Partial<Project> = {
      name: dto.name,
      description: dto.description,
      updatedAt: new Date(),
      storePrivateKey: dto.storePrivateKey,
      privateKey: dto.storePrivateKey ? project.privateKey : null
    }

    let privateKey = undefined,
      publicKey = undefined
    // A new key pair can be generated only if:
    // - The existing private key is provided
    // - Or, the private key was stored
    // Only administrators can do this action since it's irreversible!
    if (dto.regenerateKeyPair && (dto.privateKey || project.privateKey)) {
      // Check if the user has the permission to regenerate the key pair
      this.permission.isProjectAdmin(user, projectId)

      const res = createKeyPair()
      privateKey = res.privateKey
      publicKey = res.publicKey

      data.publicKey = publicKey
      // Check if the private key should be stored
      data.privateKey = dto.storePrivateKey ? privateKey : null

      // TODO: Re-hash all secrets
    }

    // Update and return the project
    const updatedProject = await this.projectRepository.updateProject(
      projectId,
      data,
      user.id
    )

    this.log.debug(`Updated project ${updatedProject.id}`)
    return {
      ...updatedProject,
      privateKey
    }
  }

  async deleteProject(user: User, projectId: Project['id']): Promise<void> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to delete the project
    this.permission.canDeleteProject(user, projectId)

    // Delete the project
    await this.projectRepository.deleteProject(projectId)
    this.log.debug(`Deleted project ${project}`)
  }

  async addUsersToProject(
    user: User,
    projectId: Project['id'],
    members: ProjectMemberDTO[]
  ): Promise<void> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to add users to the project
    this.permission.canAddUserToProject(user, projectId)

    // Add users to the project if any
    if (members && members.length > 0) {
      this.addMembersToProject(project, user, members)
    }
  }

  async removeUsersFromProject(
    user: User,
    projectId: Project['id'],
    userIds: User['id'][]
  ): Promise<void> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to remove users from the project
    this.permission.canRemoveUserFromProject(user, projectId)

    // Check if the user is already a member of the project
    if (
      !(await this.projectRepository.memberExistsInProject(projectId, user.id))
    )
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not a member of project ${project.name} (${project.id})`
      )

    // Remove users from the project if any
    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        if (userId === user.id)
          throw new ConflictException(
            `You cannot remove yourself from the project. Please delete the project instead.`
          )

        await this.projectRepository.removeMemberFromProject(projectId, userId)

        this.log.debug(
          `Removed user ${userId} from project ${project.name} (${project.id})`
        )
      }
    }
  }

  async updateMemberRole(
    user: User,
    projectId: Project['id'],
    userId: User['id'],
    role: ProjectRole
  ): Promise<void> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to update the role of the user
    this.permission.canUpdateUserPermissionsOfProject(user, projectId)

    // Check if the member in concern is a part of the project or not
    if (
      !(await this.projectRepository.memberExistsInProject(projectId, userId))
    )
      throw new NotFoundException(
        `User ${userId} is not a member of project ${project.name} (${project.id})`
      )

    // Update the role of the user
    await this.projectRepository.updateMembership(projectId, userId, {
      role
    })

    this.log.debug(
      `Updated role of user ${userId} to ${role} in project ${project.name} (${project.id})`
    )
  }

  async isUserMemberOfProject(
    user: User,
    projectId: Project['id'],
    otherUserId: User['id']
  ): Promise<boolean> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has maintainer or owner role in the project
    this.permission.canUpdateUserPermissionsOfProject(user, projectId)

    return await this.projectRepository.memberExistsInProject(
      projectId,
      otherUserId
    )
  }

  async acceptInvitation(
    @CurrentUser() user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the project
    if (!(await this.projectRepository.invitationPending(projectId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not invited to project ${projectId}`
      )

    // Update the membership
    await this.projectRepository.updateMembership(projectId, user.id, {
      invitationAccepted: true
    })

    this.log.debug(
      `User ${user.name} (${user.id}) accepted invitation to project ${projectId}`
    )
  }

  async cancelInvitation(
    @CurrentUser() user: User,
    projectId: Project['id'],
    inviteeId: User['id']
  ): Promise<void> {
    // Check if the user has permission to decline the invitation
    this.permission.canRemoveUserFromProject(user, projectId)

    // Check if the user has a pending invitation to the project
    if (!(await this.projectRepository.invitationPending(projectId, inviteeId)))
      throw new ConflictException(
        `User ${user.id} is not invited to project ${projectId}`
      )

    // Delete the membership
    await this.projectRepository.deleteMembership(projectId, inviteeId)

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to project ${projectId}`
    )
  }

  async declineInvitation(
    @CurrentUser() user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the project
    if (!(await this.projectRepository.invitationPending(projectId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not invited to project ${projectId}`
      )

    // Delete the membership
    await this.projectRepository.deleteMembership(projectId, user.id)

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to project ${projectId}`
    )
  }

  async leaveProject(
    @CurrentUser() user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Check if the user is a member of the project
    if (
      !(await this.projectRepository.memberExistsInProject(projectId, user.id))
    )
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not a member of project ${projectId}`
      )

    // Delete the membership
    await this.projectRepository.deleteMembership(projectId, user.id)

    this.log.debug(`User ${user.name} (${user.id}) left project ${projectId}`)
  }

  async getProjectByUserAndId(
    user: User,
    projectId: Project['id']
  ): Promise<Project & { members: number }> {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    //@ts-expect-error We know that project.members is not undefined since it is included in the query
    const memberCount = project.members.length

    const data = {
      ...project,
      members: memberCount
    }
    return data
  }

  async getProjectById(
    projectId: Project['id']
  ): Promise<Project & { members: number }> {
    const project = await this.projectRepository.getProjectById(projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    //@ts-expect-error We know that project.members is not undefined since it is included in the query
    const memberCount = project.members.length

    const data = {
      ...project,
      members: memberCount
    }
    return data
  }

  async getProjectsOfUser(
    user: User,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Array<Partial<Project & { role: ProjectRole }>>> {
    return (
      await this.projectRepository.getProjectsOfUser(
        user.id,
        page,
        limit,
        sort,
        order,
        search
      )
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))
  }

  async getProjects(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Partial<Project>[]> {
    return (
      await this.projectRepository.getProjects(page, limit, sort, order, search)
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))
  }

  async getProjectMembers(
    user: User,
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<
    Array<{
      id: string
      role: ProjectRole
      user: User
      invitationAccepted: boolean
    }>
  > {
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    return await this.projectRepository.getMembersOfProject(
      projectId,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  private async addMembersToProject(
    project: Project,
    currentUser: User,
    members: ProjectMemberDTO[]
  ) {
    for (const member of members) {
      let memberUser: User | null = await this.userRepository.findUserByEmail(
        member.email
      )

      // Check if the user is already a member of the project
      if (
        memberUser &&
        (await this.projectRepository.memberExistsInProject(
          project.id,
          memberUser.id
        ))
      )
        continue

      if (memberUser) {
        this.resendService.projectInvitationMailForRegisteredUser(
          member.email,
          project.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/project/${project.id}/join`,
          currentUser.name,
          member.role
        )

        this.log.debug(
          `Sent project invitation mail to registered user ${memberUser}`
        )
      } else {
        memberUser = await this.userRepository.createUser(member.email)

        this.log.debug(`Created non-registered user ${memberUser}`)

        this.resendService.projectInvitationMailForNonRegisteredUser(
          member.email,
          project.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/project/${
            project.id
          }/join?token=${await await this.jwt.signAsync({
            id: memberUser.id
          })}`,
          currentUser.name,
          member.role
        )

        this.log.debug(
          `Sent project invitation mail to non-registered user ${memberUser}`
        )
      }

      // Create the project membership
      const membership = await this.projectRepository.addMemberToProject(
        project.id,
        memberUser.id,
        member.role
      )

      this.log.debug(
        `Added user ${memberUser} as ${member.role} to project ${project.name}. Membership: ${membership.id}`
      )
    }
  }
}
