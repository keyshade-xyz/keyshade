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
  Environment,
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
import getWorkspaceWithAuthority from '../../common/get-workspace-with-authority'

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
    private readonly projectService: ProjectService,
    private readonly environmentService: EnvironmentService,
    private readonly secretService: SecretService,
    private readonly variableService: VariableService
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

    createEvent(
      {
        triggeredBy: user,
        entity: approval,
        type: EventType.APPROVAL_UPDATED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} updated`,
        metadata: {
          approvalId
        }
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

    createEvent(
      {
        triggeredBy: user,
        type: EventType.APPROVAL_DELETED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} deleted`,
        metadata: {
          approvalId
        }
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

    // await createEvent(
    //   {
    //     triggeredBy: user,
    //     entity: approval,
    //     type: EventType.APPROVAL_REJECTED,
    //     source: EventSource.APPROVAL,
    //     title: `Approval with id ${approvalId} rejected`,
    //     metadata: {
    //       approvalId
    //     }
    //   },
    //   this.prisma
    // )
  }

  async approveApproval(user: User, approvalId: Approval['id']) {
    // Check if the user has the authority to approve the approval
    const approval = await this.checkApprovalAuthority(user, approvalId)

    this.isApprovalInActableState(approval)

    const op = []

    // Update the approval
    op.push(
      this.prisma.approval.update({
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
    )

    if (approval.action === ApprovalAction.DELETE) {
      await this.deleteItem(approval, user)
    } else {
      switch (approval.itemType) {
        case ApprovalItemType.WORKSPACE: {
          switch (approval.action) {
            case ApprovalAction.UPDATE: {
              op.push(
                this.workspaceService.update(
                  approval.itemId,
                  approval.metadata as UpdateWorkspaceMetadata,
                  user
                )
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
              op.push(this.projectService.makeProjectApproved(approval.itemId))
              break
            }
            case ApprovalAction.UPDATE: {
              op.push(
                this.projectService.update(
                  approval.metadata as UpdateProjectMetadata,
                  user,
                  project
                )
              )
              break
            }
          }
          break
        }
        case ApprovalItemType.ENVIRONMENT: {
          switch (approval.action) {
            case ApprovalAction.CREATE: {
              op.push(
                this.environmentService.makeEnvironmentApproved(approval.itemId)
              )
              break
            }
            case ApprovalAction.UPDATE: {
              const environment = await this.prisma.environment.findUnique({
                where: {
                  id: approval.itemId
                }
              })
              op.push(
                this.environmentService.update(
                  user,
                  environment,
                  approval.metadata as UpdateProjectMetadata
                )
              )
              break
            }
          }
          break
        }
        case ApprovalItemType.SECRET: {
          switch (approval.action) {
            case ApprovalAction.CREATE: {
              op.push(
                this.secretService.makeSecretApproved(
                  approval.itemId as Secret['id']
                )
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
                let environment: Environment
                try {
                  environment = await this.prisma.environment.findUnique({
                    where: {
                      id: metadata.environmentId
                    }
                  })
                } catch (e) {
                  throw new BadRequestException(
                    `Environment with id ${metadata.environmentId} does not exist`
                  )
                }
                op.push(
                  this.secretService.updateEnvironment(
                    user,
                    secret,
                    environment
                  )
                )
              } else if (metadata.rollbackVersion) {
                op.push(
                  this.secretService.rollback(
                    user,
                    secret,
                    metadata.rollbackVersion
                  )
                )
              } else {
                op.push(
                  this.secretService.update(
                    metadata as UpdateSecretMetadata,
                    user,
                    secret
                  )
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
              op.push(
                this.variableService.makeVariableApproved(approval.itemId)
              )
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
                let environment: Environment
                try {
                  environment = await this.prisma.environment.findUnique({
                    where: {
                      id: metadata.environmentId
                    }
                  })
                } catch (e) {
                  throw new BadRequestException(
                    `Environment with id ${metadata.environmentId} does not exist`
                  )
                }
                op.push(
                  this.variableService.updateEnvironment(
                    user,
                    variable,
                    environment
                  )
                )
              } else if (metadata.rollbackVersion) {
                op.push(
                  this.variableService.rollback(
                    user,
                    variable,
                    metadata.rollbackVersion
                  )
                )
              } else {
                op.push(
                  this.variableService.update(
                    metadata as UpdateVariableMetadata,
                    user,
                    variable
                  )
                )
              }
              break
            }
          }
        }
      }
    }

    await Promise.all(op)

    this.logger.log(`Approval with id ${approvalId} approved by ${user.id}`)

    createEvent(
      {
        triggeredBy: user,
        entity: approval,
        type: EventType.APPROVAL_APPROVED,
        source: EventSource.APPROVAL,
        title: `Approval with id ${approvalId} approved`,
        metadata: {
          approvalId
        }
      },
      this.prisma
    )
  }

  async getApprovalById(user: User, approvalId: Approval['id']) {
    return this.checkApprovalAuthority(user, approvalId)
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
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.MANAGE_APPROVALS,
      this.prisma
    )

    return this.prisma.approval.findMany({
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
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    itemTypes: ApprovalItemType[],
    actions: ApprovalAction[],
    statuses: ApprovalStatus[]
  ) {
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.READ_WORKSPACE,
      this.prisma
    )

    return this.prisma.approval.findMany({
      where: {
        requestedById: user.id,
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

    if (user.isAdmin) {
      return approval
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
