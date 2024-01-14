import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import {
  Project,
  ProjectMember,
  ProjectRole,
  SecretVersion,
  User
} from '@prisma/client'
import {
  CreateProject,
  ProjectMemberDTO
} from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { ProjectPermission } from '../misc/project.permission'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { JwtService } from '@nestjs/jwt'
import { createKeyPair } from '../../common/create-key-pair'
import { excludeFields } from '../../common/exclude-fields'
import {
  ProjectWithMembersAndSecrets,
  ProjectWithSecrets
} from '../project.types'
import { PrismaService } from '../../prisma/prisma.service'
import { decrypt } from '../../common/decrypt'
import { encrypt } from '../../common/encrypt'
import { ApiKeyProjectRoles } from '../../common/api-key-roles'

@Injectable()
export class ProjectService {
  private readonly log: Logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE) private readonly resendService: IMailService,
    private readonly jwt: JwtService,
    private readonly permission: ProjectPermission
  ) {}

  async createProject(user: User, dto: CreateProject): Promise<Project> {
    // Check if project with this name already exists for the user
    if (await this.projectExists(dto.name, user.id))
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

    const userId = user.id

    // Create and return the project
    const newProject = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        storePrivateKey: data.storePrivateKey,
        lastUpdatedById: userId,
        members: {
          create: {
            userId: userId,
            role: ProjectRole.OWNER,
            invitationAccepted: true
          }
        },
        isFreeTier: false
      }
    })

    // Create and assign the environments provided in the request, if any
    // or create a default environment
    if (dto.environments && dto.environments.length > 0) {
      let defaultEnvironmentExists = false
      for (const environment of dto.environments) {
        defaultEnvironmentExists =
          defaultEnvironmentExists || environment.isDefault

        const env = await this.prisma.environment.create({
          data: {
            name: dto.name,
            description: dto.description,
            isDefault: environment.isDefault || false,
            projectId: newProject.id,
            lastUpdatedById: user.id
          }
        })

        this.log.debug(`Created environment ${env} for project ${newProject}`)
      }
    } else {
      const defaultEnvironment = await this.prisma.environment.create({
        data: {
          name: 'Default',
          description: 'Default environment for the project',
          isDefault: true,
          projectId: newProject.id,
          lastUpdatedById: user.id
        }
      })

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
    const project = (await this.getProjectByUserIdAndId(
      user.id,
      projectId
    )) as ProjectWithSecrets

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if project with this name already exists for the user
    if (dto.name && (await this.projectExists(dto.name, user.id)))
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
      )

    // Check if the user has the permission to update the project
    this.permission.isProjectAdmin(user, projectId)

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

      // Re-hash all secrets
      for (const secret of project.secrets) {
        const versions = await this.prisma.secretVersion.findMany({
          where: {
            secretId: secret.id
          }
        })

        const updatedVersions: Partial<SecretVersion>[] = []

        for (const version of versions) {
          updatedVersions.push({
            id: version.id,
            value: encrypt(
              decrypt(project.privateKey, version.value),
              privateKey
            )
          })
        }

        for (const version of updatedVersions) {
          await this.prisma.secretVersion.update({
            where: {
              id: version.id
            },
            data: {
              value: version.value
            }
          })
        }
      }
    }

    // Update and return the project
    const updatedProject = await this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        ...data,
        lastUpdatedById: user.id
      }
    })

    this.log.debug(`Updated project ${updatedProject.id}`)
    return {
      ...updatedProject,
      privateKey
    }
  }

  async deleteProject(user: User, projectId: Project['id']): Promise<void> {
    const project = await this.getProjectByUserIdAndId(user.id, projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to delete the project
    this.permission.isProjectAdmin(user, projectId)

    // Delete the project
    await this.prisma.project.delete({
      where: {
        id: projectId
      }
    })

    // Delete the API key scopes associated with this project
    await this.deleteApiKeyScopesOfProject(projectId)
    this.log.debug(`Deleted project ${project}`)
  }

  async addUsersToProject(
    user: User,
    projectId: Project['id'],
    members: ProjectMemberDTO[]
  ): Promise<void> {
    const project = await this.getProjectByUserIdAndId(user.id, projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to add users to the project
    this.permission.isProjectAdmin(user, projectId)

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
    const project = await this.getProjectByUserIdAndId(user.id, projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the user has the permission to remove users from the project
    this.permission.isProjectAdmin(user, projectId)

    // Check if the user is already a member of the project
    if (!(await this.memberExistsInProject(projectId, user.id)))
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

        // Delete the membership
        await this.prisma.projectMember.delete({
          where: {
            projectId_userId: {
              projectId,
              userId
            }
          }
        })

        // Delete the API key scopes associated with this project
        await this.deleteApiKeyScopesOfProject(projectId, userId)

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
    const project = await this.getProjectByUserIdAndId(user.id, projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    // Check if the member in concern is a part of the project or not
    if (!(await this.memberExistsInProject(projectId, userId)))
      throw new NotFoundException(
        `User ${userId} is not a member of project ${project.name} (${project.id})`
      )

    // Check if the user has the permission to update the role of the user
    this.permission.isProjectAdmin(user, projectId)

    const currentRole = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      select: {
        role: true
      }
    })

    // We only want to reduce the roles of the API key if the user's role has been downgraded
    if (
      (currentRole.role === ProjectRole.OWNER && role !== ProjectRole.OWNER) ||
      (currentRole.role === ProjectRole.MAINTAINER &&
        role == ProjectRole.VIEWER)
    ) {
      const previousAPIKeyScopes = await this.prisma.projectScope.findFirst({
        where: {
          projectId,
          apiKey: {
            userId
          }
        },
        select: {
          roles: true
        }
      })

      // Filtering out the old roles that are now not allowed
      const updatedRoles = previousAPIKeyScopes.roles.filter((scope) =>
        ApiKeyProjectRoles[role].includes(scope)
      )

      // Update the API key scopes associated with this project
      await this.prisma.projectScope.updateMany({
        where: {
          projectId,
          apiKey: {
            userId
          }
        },
        data: {
          roles: updatedRoles
        }
      })
    }

    // Update the role of the user
    await this.updateMembership(projectId, userId, {
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
    const project = await this.getProjectByUserIdAndId(user.id, projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    return await this.memberExistsInProject(projectId, otherUserId)
  }

  async acceptInvitation(
    @CurrentUser() user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the project
    if (!(await this.invitationPending(projectId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not invited to project ${projectId}`
      )

    // Update the membership
    await this.updateMembership(projectId, user.id, {
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
    this.permission.isProjectAdmin(user, projectId)

    // Check if the user has a pending invitation to the project
    if (!(await this.invitationPending(projectId, inviteeId)))
      throw new ConflictException(
        `User ${user.id} is not invited to project ${projectId}`
      )

    // Delete the membership
    await this.deleteMembership(projectId, inviteeId)

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to project ${projectId}`
    )
  }

  async declineInvitation(
    @CurrentUser() user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the project
    if (!(await this.invitationPending(projectId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not invited to project ${projectId}`
      )

    // Delete the membership
    await this.deleteMembership(projectId, user.id)

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to project ${projectId}`
    )
  }

  async leaveProject(
    @CurrentUser() user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Check if the user is a member of the project
    await this.permission.isProjectMember(user, projectId)

    // Delete the membership
    await this.deleteMembership(projectId, user.id)

    // Delete the API key scopes associated with this project
    await this.deleteApiKeyScopesOfProject(projectId, user.id)

    this.log.debug(`User ${user.name} (${user.id}) left project ${projectId}`)
  }

  async getProjectByUserAndId(
    user: User,
    projectId: Project['id']
  ): Promise<ProjectWithMembersAndSecrets> {
    const project = (await this.getProjectByUserIdAndId(
      user.id,
      projectId
    )) as ProjectWithMembersAndSecrets

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    return project
  }

  async getProjectById(
    projectId: Project['id']
  ): Promise<Project & { members: number }> {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        members: {
          select: {
            user: true,
            invitationAccepted: true,
            role: true
          }
        },
        secrets: {
          include: {
            versions: {
              orderBy: {
                version: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

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
    const memberships = await this.prisma.projectMember.findMany({
      skip: (page - 1) * limit,
      orderBy: {
        project: {
          [sort]: order
        }
      },
      include: {
        project: true
      },
      take: limit,
      where: {
        userId: user.id,
        project: {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              description: {
                contains: search
              }
            }
          ]
        }
      }
    })
    return memberships
      .map((membership) => ({
        ...membership.project,
        role: membership.role
      }))
      .map((project) => excludeFields(project, 'privateKey', 'publicKey'))
  }

  async getProjects(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Partial<Project>[]> {
    return (
      await this.prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sort]: order
        },
        where: {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              description: {
                contains: search
              }
            }
          ]
        }
      })
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
    const project = await this.getProjectByUserIdAndId(user.id, projectId)

    // Check if the project exists or not
    if (!project)
      throw new NotFoundException(`Project with id ${projectId} not found`)

    return await this.prisma.projectMember.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        project: {
          [sort]: order
        }
      },
      where: {
        projectId: projectId,
        user: {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              email: {
                contains: search
              }
            }
          ]
        }
      },
      include: {
        user: true
      }
    })
  }

  private async addMembersToProject(
    project: Project,
    currentUser: User,
    members: ProjectMemberDTO[]
  ) {
    for (const member of members) {
      let memberUser: User | null = await this.prisma.user.findUnique({
        where: {
          email: member.email
        }
      })

      // Check if the user is already a member of the project
      if (
        memberUser &&
        (await this.memberExistsInProject(project.id, memberUser.id))
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
        memberUser = await this.prisma.user.create({
          data: {
            email: member.email
          }
        })

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
      const membership = await this.prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: memberUser.id,
          role: member.role
        }
      })

      this.log.debug(
        `Added user ${memberUser} as ${member.role} to project ${project.name}. Membership: ${membership.id}`
      )
    }
  }

  private async projectExists(
    projectName: string,
    userId: User['id']
  ): Promise<boolean> {
    return this.prisma.projectMember
      .count({
        where: {
          user: {
            id: userId
          },
          project: {
            name: projectName
          }
        }
      })
      .then((count) => count > 0)
  }

  private async getProjectByUserIdAndId(
    userId: User['id'],
    projectId: Project['id']
  ): Promise<Project> {
    return await this.prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: true
      }
    })
  }

  private async memberExistsInProject(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    return await this.prisma.projectMember
      .count({
        where: {
          projectId,
          userId
        }
      })
      .then((count) => count > 0)
  }

  private async updateMembership(
    projectId: Project['id'],
    userId: User['id'],
    data: Partial<Pick<ProjectMember, 'role' | 'invitationAccepted'>>
  ): Promise<ProjectMember> {
    return await this.prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      data: {
        role: data.role,
        invitationAccepted: data.invitationAccepted
      }
    })
  }

  private async deleteMembership(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<void> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })
  }

  private async invitationPending(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean> {
    return await this.prisma.projectMember
      .count({
        where: {
          projectId,
          userId,
          invitationAccepted: false
        }
      })
      .then((count) => count > 0)
  }

  private async deleteApiKeyScopesOfProject(
    projectId: Project['id'],
    userId?: User['id']
  ) {
    await this.prisma.projectScope.deleteMany({
      where: {
        projectId,
        apiKey: {
          userId
        }
      }
    })
  }
}
