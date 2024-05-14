import { ConflictException, Injectable, Logger } from '@nestjs/common'
import {
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
  Authority,
  EventSource,
  EventType,
  Project,
  SecretVersion,
  User,
  Workspace
} from '@prisma/client'
import { CreateProject } from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { createKeyPair } from '../../common/create-key-pair'
import { excludeFields } from '../../common/exclude-fields'
import { PrismaService } from '../../prisma/prisma.service'
import { decrypt } from '../../common/decrypt'
import { encrypt } from '../../common/encrypt'
import { v4 } from 'uuid'
import createEvent from '../../common/create-event'
import workspaceApprovalEnabled from '../../common/workspace-approval-enabled'
import createApproval from '../../common/create-approval'
import { UpdateProjectMetadata } from '../../approval/approval.types'
import { ProjectWithSecrets } from '../project.types'
import { AuthorityCheckerService } from '../../common/authority-checker.service'

@Injectable()
export class ProjectService {
  private readonly log: Logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async createProject(
    user: User,
    workspaceId: Workspace['id'],
    dto: CreateProject,
    reason?: string
  ) {
    // Check if the workspace exists or not
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.CREATE_PROJECT,
        prisma: this.prisma
      })

    // Check if project with this name already exists for the user
    if (await this.projectExists(dto.name, workspaceId))
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
      )

    // Create the public and private key pair
    const { publicKey, privateKey } = createKeyPair()

    const approvalEnabled = await workspaceApprovalEnabled(
      workspaceId,
      this.prisma
    )

    const data: any = {
      name: dto.name,
      description: dto.description,
      storePrivateKey: dto.storePrivateKey,
      publicKey,
      accessLevel: dto.accessLevel,
      pendingCreation: approvalEnabled
    }

    // Check if the private key should be stored
    // PLEASE DON'T STORE YOUR PRIVATE KEYS WITH US!!
    if (dto.storePrivateKey) {
      data.privateKey = privateKey
    }

    const userId = user.id

    const newProjectId = v4()

    const adminRole = await this.prisma.workspaceRole.findFirst({
      where: {
        workspaceId: workspaceId,
        hasAdminAuthority: true
      }
    })

    // Create and return the project
    const createNewProject = this.prisma.project.create({
      data: {
        id: newProjectId,
        ...data,
        workspace: {
          connect: {
            id: workspaceId
          }
        },
        lastUpdatedBy: {
          connect: {
            id: userId
          }
        }
      }
    })

    const addProjectToAdminRoleOfItsWorkspace =
      this.prisma.workspaceRole.update({
        where: {
          id: adminRole.id
        },
        data: {
          projects: {
            create: {
              project: {
                connect: {
                  id: newProjectId
                }
              }
            }
          }
        }
      })

    const createEnvironmentOps = []

    // Create and assign the environments provided in the request, if any
    // or create a default environment
    if (dto.environments && dto.environments.length > 0) {
      let defaultEnvironmentExists = false
      for (const environment of dto.environments) {
        createEnvironmentOps.push(
          this.prisma.environment.create({
            data: {
              name: environment.name,
              description: environment.description,
              isDefault:
                defaultEnvironmentExists === false
                  ? environment.isDefault
                  : false,
              projectId: newProjectId,
              lastUpdatedById: user.id
            }
          })
        )

        defaultEnvironmentExists =
          defaultEnvironmentExists || environment.isDefault
      }
    } else {
      createEnvironmentOps.push(
        this.prisma.environment.create({
          data: {
            name: 'Default',
            description: 'Default environment for the project',
            isDefault: true,
            projectId: newProjectId,
            lastUpdatedById: user.id
          }
        })
      )
    }

    const [newProject] = await this.prisma.$transaction([
      createNewProject,
      addProjectToAdminRoleOfItsWorkspace,
      ...createEnvironmentOps
    ])

    await createEvent(
      {
        triggeredBy: user,
        entity: newProject,
        type: EventType.PROJECT_CREATED,
        source: EventSource.PROJECT,
        title: `Project created`,
        metadata: {
          projectId: newProject.id,
          name: newProject.name,
          workspaceId,
          workspaceName: workspace.name
        },
        workspaceId
      },
      this.prisma
    )

    this.log.debug(`Created project ${newProject}`)

    // It is important that we log before the private key is set
    // in order to not log the private key
    newProject.privateKey = privateKey

    if (approvalEnabled) {
      const approval = await createApproval(
        {
          action: ApprovalAction.CREATE,
          itemType: ApprovalItemType.PROJECT,
          itemId: newProjectId,
          reason,
          user,
          workspaceId
        },
        this.prisma
      )
      return {
        project: newProject,
        approval
      }
    } else {
      return newProject
    }
  }

  async updateProject(
    user: User,
    projectId: Project['id'],
    dto: UpdateProject,
    reason?: string
  ) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.UPDATE_PROJECT,
        prisma: this.prisma
      })

    // Check if project with this name already exists for the user
    if (
      (dto.name && (await this.projectExists(dto.name, user.id))) ||
      project.name === dto.name
    )
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
      )

    if (
      !project.pendingCreation &&
      (await workspaceApprovalEnabled(project.workspaceId, this.prisma))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.PROJECT,
          itemId: projectId,
          reason,
          user,
          workspaceId: project.workspaceId,
          metadata: dto
        },
        this.prisma
      )
    } else {
      return this.update(dto, user, project)
    }
  }

  async deleteProject(user: User, projectId: Project['id'], reason?: string) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.DELETE_PROJECT,
        prisma: this.prisma
      })

    if (await workspaceApprovalEnabled(project.workspaceId, this.prisma)) {
      return await createApproval(
        {
          action: ApprovalAction.DELETE,
          itemType: ApprovalItemType.PROJECT,
          itemId: projectId,
          reason,
          user,
          workspaceId: project.workspaceId
        },
        this.prisma
      )
    } else {
      return this.delete(user, project)
    }
  }

  async getProjectById(user: User, projectId: Project['id']) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.READ_PROJECT,
        prisma: this.prisma
      })

    return project
  }

  async getProjectsOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_PROJECT,
      prisma: this.prisma
    })

    return (
      await this.prisma.project.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          [sort]: order
        },
        where: {
          pendingCreation: false,
          workspaceId,
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
          ],
          workspace: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      })
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))
  }

  private async projectExists(
    projectName: string,
    workspaceId: Workspace['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          workspace: {
            projects: {
              some: {
                name: projectName,
                pendingCreation: false
              }
            }
          }
        }
      })) > 0
    )
  }

  async makeProjectApproved(projectId: Project['id']) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    })

    // Check if a project with this name already exists
    const projectExists = await this.prisma.project.count({
      where: {
        name: project.name,
        pendingCreation: false,
        workspaceId: project.workspaceId
      }
    })

    if (projectExists > 0) {
      throw new ConflictException(
        `Project with this name ${project.name} already exists`
      )
    }

    return this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        pendingCreation: false,
        environments: {
          updateMany: {
            where: {
              projectId
            },
            data: {
              pendingCreation: false
            }
          }
        },
        secrets: {
          updateMany: {
            where: {
              projectId
            },
            data: {
              pendingCreation: false
            }
          }
        },
        variables: {
          updateMany: {
            where: {
              projectId
            },
            data: {
              pendingCreation: false
            }
          }
        }
      }
    })
  }

  async update(
    dto: UpdateProject | UpdateProjectMetadata,
    user: User,
    project: ProjectWithSecrets
  ) {
    const data: Partial<Project> = {
      name: dto.name,
      description: dto.description,
      storePrivateKey: dto.storePrivateKey,
      privateKey: dto.storePrivateKey ? project.privateKey : null,
      accessLevel: dto.accessLevel
    }

    const versionUpdateOps = []

    let privateKey = undefined,
      publicKey = undefined
    // A new key pair can be generated only if:
    // - The existing private key is provided
    // - Or, the private key was stored
    // Only administrators can do this action since it's irreversible!
    if (dto.regenerateKeyPair && (dto.privateKey || project.privateKey)) {
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
            value: await encrypt(
              await decrypt(project.privateKey, version.value),
              privateKey
            )
          })
        }

        for (const version of updatedVersions) {
          versionUpdateOps.push(
            this.prisma.secretVersion.update({
              where: {
                id: version.id
              },
              data: {
                value: version.value
              }
            })
          )
        }
      }
    }

    // Update and return the project
    const updateProjectOp = this.prisma.project.update({
      where: {
        id: project.id
      },
      data: {
        ...data,
        lastUpdatedById: user.id
      }
    })

    const [updatedProject] = await this.prisma.$transaction([
      updateProjectOp,
      ...versionUpdateOps
    ])

    await createEvent(
      {
        triggeredBy: user,
        entity: updatedProject,
        type: EventType.PROJECT_UPDATED,
        source: EventSource.PROJECT,
        title: `Project updated`,
        metadata: {
          projectId: updatedProject.id,
          name: updatedProject.name
        },
        workspaceId: updatedProject.workspaceId
      },
      this.prisma
    )

    this.log.debug(`Updated project ${updatedProject.id}`)
    return {
      ...updatedProject,
      privateKey
    }
  }

  async delete(user: User, project: Project) {
    const op = []

    // Delete the project
    op.push(
      this.prisma.project.delete({
        where: {
          id: project.id
        }
      })
    )

    // If the project is in pending creation and the workspace approval is enabled, we need to
    // delete the approval as well
    if (
      project.pendingCreation &&
      (await workspaceApprovalEnabled(project.workspaceId, this.prisma))
    ) {
      op.push(
        this.prisma.approval.deleteMany({
          where: {
            itemId: project.id,
            itemType: ApprovalItemType.PROJECT,
            action: ApprovalAction.DELETE,
            status: ApprovalStatus.PENDING
          }
        })
      )
    }

    await this.prisma.$transaction(op)

    await createEvent(
      {
        triggeredBy: user,
        type: EventType.PROJECT_DELETED,
        source: EventSource.PROJECT,
        entity: project,
        title: `Project deleted`,
        metadata: {
          projectId: project.id,
          name: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.log.debug(`Deleted project ${project}`)
  }
}
