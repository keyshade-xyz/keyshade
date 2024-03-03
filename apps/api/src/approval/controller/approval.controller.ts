import { Controller, Delete, Get, Param, Put, Query } from '@nestjs/common'
import { ApprovalService } from '../service/approval.service'
import {
  Approval,
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
  Authority,
  User
} from '@prisma/client'
import { CurrentUser } from '../../decorators/user.decorator'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'

@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Put(':approvalId')
  @RequiredApiKeyAuthorities(Authority.MANAGE_APPROVALS)
  async updateApproval(
    @CurrentUser() user: User,
    @Param('approvalId') approvalId: Approval['id'],
    @Query('reason') reason: string
  ) {
    return this.approvalService.updateApproval(user, reason, approvalId)
  }

  @Delete(':approvalId')
  @RequiredApiKeyAuthorities(Authority.MANAGE_APPROVALS)
  async deleteApproval(
    @CurrentUser() user: User,
    @Param('approvalId') approvalId: Approval['id']
  ) {
    return this.approvalService.deleteApproval(user, approvalId)
  }

  @Put(':approvalId/approve')
  @RequiredApiKeyAuthorities(Authority.MANAGE_APPROVALS)
  async approveApproval(
    @CurrentUser() user: User,
    @Param('approvalId') approvalId: Approval['id']
  ) {
    return this.approvalService.approveApproval(user, approvalId)
  }

  @Put(':approvalId/reject')
  @RequiredApiKeyAuthorities(Authority.MANAGE_APPROVALS)
  async rejectApproval(
    @CurrentUser() user: User,
    @Param('approvalId') approvalId: Approval['id']
  ) {
    return this.approvalService.rejectApproval(user, approvalId)
  }

  @Get(':approvalId')
  @RequiredApiKeyAuthorities(Authority.MANAGE_APPROVALS)
  async getApproval(
    @CurrentUser() user: User,
    @Param('approvalId') approvalId: Approval['id']
  ) {
    return this.approvalService.getApprovalById(user, approvalId)
  }

  @Get(':workspaceId/all-in-workspace')
  @RequiredApiKeyAuthorities(Authority.MANAGE_APPROVALS)
  async getAllApprovalsInWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: string = 'asc',
    @Query('itemTypes')
    itemTypes: ApprovalItemType[] = [
      ApprovalItemType.ENVIRONMENT,
      ApprovalItemType.PROJECT,
      ApprovalItemType.SECRET,
      ApprovalItemType.VARIABLE,
      ApprovalItemType.WORKSPACE
    ],
    @Query('actions')
    actions: ApprovalAction[] = [
      ApprovalAction.CREATE,
      ApprovalAction.DELETE,
      ApprovalAction.UPDATE
    ],
    @Query('statuses')
    statuses: ApprovalStatus[] = [
      ApprovalStatus.PENDING,
      ApprovalStatus.APPROVED,
      ApprovalStatus.REJECTED
    ]
  ) {
    return this.approvalService.getApprovalsForWorkspace(
      user,
      workspaceId,
      page,
      limit,
      sort,
      order,
      itemTypes,
      actions,
      statuses
    )
  }

  @Get(':workspaceId/all-by-user')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getAllApprovalsByUser(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: string = 'asc',
    @Query('itemTypes')
    itemTypes: ApprovalItemType[] = [
      ApprovalItemType.ENVIRONMENT,
      ApprovalItemType.PROJECT,
      ApprovalItemType.SECRET,
      ApprovalItemType.VARIABLE,
      ApprovalItemType.WORKSPACE
    ],
    @Query('actions')
    actions: ApprovalAction[] = [
      ApprovalAction.CREATE,
      ApprovalAction.DELETE,
      ApprovalAction.UPDATE
    ],
    @Query('statuses')
    statuses: ApprovalStatus[] = [
      ApprovalStatus.PENDING,
      ApprovalStatus.APPROVED,
      ApprovalStatus.REJECTED
    ]
  ) {
    return this.approvalService.getApprovalsOfUser(
      user,
      workspaceId,
      page,
      limit,
      sort,
      order,
      itemTypes,
      actions,
      statuses
    )
  }
}
