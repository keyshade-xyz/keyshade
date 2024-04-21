import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import {
  Approval,
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
  Authority,
  EventSource,
  EventType,
  Secret,
  User,
  Workspace
} from '@prisma/client'
import createEvent from '../../common/create-event'
import getCollectiveWorkspaceAuthorities from '../../common/get-collective-workspace-authorities'
import { EnvironmentService } from '../../environment/service/environment.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ProjectService } from '../../project/service/project.service'
import { SecretService } from '../../secret/service/secret.service'
import { VariableService } from '../../variable/service/variable.service'
import { WorkspaceService } from '../../workspace/service/workspace.service'
import {
  UpdateProjectMetadata,
  UpdateSecretMetadata,
  UpdateVariableMetadata,
  UpdateWorkspaceMetadata
} from '../approval.types'
import { AuthorityCheckerService } from '../../common/authority-checker.service'

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
    private readonly projectService: ProjectService,
    private readonly environmentService: EnvironmentService,
    private readonly secretService: SecretService,
    private readonly variableService: VariableService,
    public authorityCheckerService: AuthorityCheckerService
  ) {}

  async updateApproval(user: User, reason: string, approvalId: Approval['id']) {
    // Check if the user has the authority to update the approval
    let approval = await this.checkApprovalAuthority(user, approvalId)

    this.isApprovalInActableState(approval)

    // Update the approval
    approval = await this.prisma.approval.update({
      where: {
        id: approvalId
      },
      data: {
        reason
      }
    })

    this.logger.log(`Approval with id ${approvalId} updated by ${user.id}`)

    await createEvent(
      {
        triggeredBy: user,
        entity: approval,
        type: EventType.APPROVAL_UPDATED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} updated`,
        metadata: {
          approvalId
        },
        workspaceId: approval.workspaceId
      },
      this.prisma
    )

    return approval
  }

  async deleteApproval(user: User, approvalId: Approval['id']) {
    // Check if the user has the authority to delete the approval
    const approval = await this.checkApprovalAuthority(user, approvalId)

    // If the approval is of type CREATE, we need to delete the item as well
    if (
      approval.status === ApprovalStatus.PENDING &&
      approval.action === ApprovalAction.CREATE
    ) {
      await this.deleteItem(approval, user)
    }

    // Delete the approval
    await this.prisma.approval.delete({
      where: {
        id: approvalId
      }
    })

    this.logger.log(`Approval with id ${approvalId} deleted by ${user.id}`)

    await createEvent(
      {
        triggeredBy: user,
        entity: approval,
        type: EventType.APPROVAL_DELETED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} deleted`,
        metadata: {
          approvalId
        },
        workspaceId: approval.workspaceId
      },
      this.prisma
    )
  }

  async rejectApproval(user: User, approvalId: Approval['id']) {
    // Check if the user has the authority to reject the approval
    let approval = await this.checkApprovalAuthority(user, approvalId)

    this.isApprovalInActableState(approval)

    // Update the approval
    approval = await this.prisma.approval.update({
      where: {
        id: approvalId
      },
      data: {
        status: ApprovalStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })

    // Delete the item if the action is CREATE
    if (approval.action === ApprovalAction.CREATE) {
      await this.deleteItem(approval, user)
    }

    this.logger.log(`Approval with id ${approvalId} rejected by ${user.id}`)

    await createEvent(
      {
        triggeredBy: user,
        entity: approval,
        type: EventType.APPROVAL_REJECTED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} rejected`,
        metadata: {
          approvalId
        },
        workspaceId: approval.workspaceId
      },
      this.prisma
    )
  }

  async approveApproval(user: User, approvalId: Approval['id']) {
    // Check if the user has the authority to approve the approval
    const approval = await this.checkApprovalAuthority(user, approvalId)

    this.isApprovalInActableState(approval)

    if (approval.action === ApprovalAction.DELETE) {
      await this.deleteItem(approval, user)
    } else {
      switch (approval.itemType) {
        case ApprovalItemType.WORKSPACE: {
          switch (approval.action) {
            case ApprovalAction.UPDATE: {
              await this.workspaceService.update(
                approval.itemId,
                approval.metadata as UpdateWorkspaceMetadata,
                user
              )
              break
            }
          }
          break
        }
        case ApprovalItemType.PROJECT: {
          const project = await this.prisma.project.findUnique({
            where: {
              id: approval.itemId
            },
            include: {
              secrets: true
            }
          })
          switch (approval.action) {
            case ApprovalAction.CREATE: {
              await this.projectService.makeProjectApproved(approval.itemId)
              break
            }
            case ApprovalAction.UPDATE: {
              await this.projectService.update(
                approval.metadata as UpdateProjectMetadata,
                user,
                project
              )
              break
            }
          }
          break
        }
        case ApprovalItemType.ENVIRONMENT: {
          switch (approval.action) {
            case ApprovalAction.CREATE: {
              await this.environmentService.makeEnvironmentApproved(
                approval.itemId
              )
              break
            }
            case ApprovalAction.UPDATE: {
              const environment = await this.prisma.environment.findUnique({
                where: {
                  id: approval.itemId
                }
              })
              await this.environmentService.update(
                user,
                environment,
                approval.metadata as UpdateProjectMetadata
              )
              break
            }
          }
          break
        }
        case ApprovalItemType.SECRET: {
          switch (approval.action) {
            case ApprovalAction.CREATE: {
              await this.secretService.makeSecretApproved(
                approval.itemId as Secret['id']
              )
              break
            }
            case ApprovalAction.UPDATE: {
              const secret = await this.prisma.secret.findUnique({
                where: {
                  id: approval.itemId
                },
                include: {
                  project: true,
                  versions: true
                }
              })
              const metadata = approval.metadata as UpdateSecretMetadata

              if (metadata.environmentId) {
                const environment = await this.prisma.environment.findUnique({
                  where: {
                    id: metadata.environmentId
                  }
                })

                if (!environment) {
                  throw new BadRequestException(
                    `Environment with id ${metadata.environmentId} does not exist`
                  )
                }
                await this.secretService.updateEnvironment(
                  user,
                  secret,
                  environment
                )
              } else if (metadata.rollbackVersion) {
                await this.secretService.rollback(
                  user,
                  secret,
                  metadata.rollbackVersion
                )
              } else {
                await this.secretService.update(
                  metadata as UpdateSecretMetadata,
                  user,
                  secret
                )
              }
              break
            }
          }
          break
        }
        case ApprovalItemType.VARIABLE: {
          switch (approval.action) {
            case ApprovalAction.CREATE: {
              await this.variableService.makeVariableApproved(approval.itemId)
              break
            }
            case ApprovalAction.UPDATE: {
              const variable = await this.prisma.variable.findUnique({
                where: {
                  id: approval.itemId
                },
                include: {
                  project: true,
                  versions: true
                }
              })
              const metadata = approval.metadata as UpdateVariableMetadata

              if (metadata.environmentId) {
                const environment = await this.prisma.environment.findUnique({
                  where: {
                    id: metadata.environmentId
                  }
                })

                if (!environment) {
                  throw new BadRequestException(
                    `Environment with id ${metadata.environmentId} does not exist`
                  )
                }
                await this.variableService.updateEnvironment(
                  user,
                  variable,
                  environment
                )
              } else if (metadata.rollbackVersion) {
                await this.variableService.rollback(
                  user,
                  variable,
                  metadata.rollbackVersion
                )
              } else {
                await this.variableService.update(
                  metadata as UpdateVariableMetadata,
                  user,
                  variable
                )
              }
              break
            }
          }
        }
      }
    }

    // Update the approval
    await this.prisma.approval.update({
      where: {
        id: approvalId
      },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })

    this.logger.log(`Approval with id ${approvalId} approved by ${user.id}`)

    await createEvent(
      {
        triggeredBy: user,
        entity: approval,
        type: EventType.APPROVAL_APPROVED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} approved`,
        metadata: {
          approvalId
        },
        workspaceId: approval.workspaceId
      },
      this.prisma
    )
  }

  async getApprovalById(user: User, approvalId: Approval['id']) {
    const approval = await this.checkApprovalAuthority(user, approvalId)

    switch (approval.itemType) {
      case ApprovalItemType.PROJECT: {
        const project = await this.prisma.project.findUnique({
          where: {
            id: approval.itemId
          }
        })
        return {
          approval,
          project
        }
      }
      case ApprovalItemType.ENVIRONMENT: {
        const environment = await this.prisma.environment.findUnique({
          where: {
            id: approval.itemId
          }
        })
        return {
          approval,
          environment
        }
      }
      case ApprovalItemType.SECRET: {
        const secret = await this.prisma.secret.findUnique({
          where: {
            id: approval.itemId
          }
        })
        return {
          approval,
          secret
        }
      }
      case ApprovalItemType.VARIABLE: {
        const variable = await this.prisma.variable.findUnique({
          where: {
            id: approval.itemId
          }
        })
        return {
          approval,
          variable
        }
      }
      case ApprovalItemType.WORKSPACE: {
        const workspace = await this.prisma.workspace.findUnique({
          where: {
            id: approval.itemId
          }
        })
        return {
          approval,
          workspace
        }
      }
    }
  }

  async getApprovalsForWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    itemTypes: ApprovalItemType[],
    actions: ApprovalAction[],
    statuses: ApprovalStatus[]
  ) {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.MANAGE_APPROVALS,
      prisma: this.prisma
    })

    return await this.prisma.approval.findMany({
      where: {
        workspaceId,
        itemType: {
          in: itemTypes
        },
        action: {
          in: actions
        },
        status: {
          in: statuses
        }
      },
      orderBy: {
        [sort]: order
      },
      skip: page * limit,
      take: limit
    })
  }

  async getApprovalsOfUser(
    user: User,
    otherUserId: User['id'],
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    itemTypes: ApprovalItemType[],
    actions: ApprovalAction[],
    statuses: ApprovalStatus[]
  ) {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_WORKSPACE,
      prisma: this.prisma
    })

    return this.prisma.approval.findMany({
      where: {
        requestedById: otherUserId,
        workspaceId,
        itemType: {
          in: itemTypes
        },
        action: {
          in: actions
        },
        status: {
          in: statuses
        }
      },
      orderBy: {
        [sort]: order
      },
      skip: page * limit,
      take: limit
    })
  }

  /**
   * A user should only be able to fetch an approval if they are an admin, or a workspace admin,
   * or if they have the MANAGE_APPROVALS authority in the workspace, or if they are the user
   * who requested the approval
   * @param user The user fetching the approval
   * @param approvalId The id of the approval to fetch
   * @returns The fetched approval
   */
  private async checkApprovalAuthority(user: User, approvalId: Approval['id']) {
    const approval = await this.prisma.approval.findFirst({
      where: {
        id: approvalId
      }
    })

    if (!approval) {
      throw new NotFoundException(
        `Approval with id ${approvalId} does not exist`
      )
    }

    const workspaceAuthorities = await getCollectiveWorkspaceAuthorities(
      approval.workspaceId,
      user.id,
      this.prisma
    )

    if (
      workspaceAuthorities.has(Authority.WORKSPACE_ADMIN) ||
      workspaceAuthorities.has(Authority.MANAGE_APPROVALS) ||
      approval.requestedById === user.id
    ) {
      return approval
    } else {
      throw new UnauthorizedException(
        `User with id ${user.id} is not authorized to view approval with id ${approvalId}`
      )
    }
  }

  /**
   * Check if the approval is in a state where it can be enacted upon.
   * Actions -> approve, reject, update
   * @param approval The approval to check
   */
  private isApprovalInActableState(approval: Approval) {
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Approval with id ${approval.id} is already approved/rejected`
      )
    }
  }

  async deleteItem(approval: Approval, user: User) {
    switch (approval.itemType) {
      case ApprovalItemType.PROJECT: {
        const project = await this.prisma.project.findUnique({
          where: {
            id: approval.itemId
          }
        })
        await this.projectService.delete(user, project)
        break
      }
      case ApprovalItemType.ENVIRONMENT: {
        const environment = await this.prisma.environment.findUnique({
          where: {
            id: approval.itemId
          },
          include: {
            project: true
          }
        })
        await this.environmentService.delete(user, environment)
        break
      }
      case ApprovalItemType.SECRET: {
        const secret = await this.prisma.secret.findUnique({
          where: {
            id: approval.itemId
          },
          include: {
            project: true
          }
        })
        await this.secretService.delete(user, secret)
        break
      }
      case ApprovalItemType.VARIABLE: {
        const variable = await this.prisma.variable.findUnique({
          where: {
            id: approval.itemId
          },
          include: {
            project: true
          }
        })
        await this.variableService.delete(user, variable)
        break
      }
    }
  }
}
