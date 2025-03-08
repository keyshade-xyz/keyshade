import { Module } from '@nestjs/common'
import { WorkspaceMembershipService } from './workspace-membership.service'
import { WorkspaceMembershipController } from './workspace-membership.controller'

@Module({
  providers: [WorkspaceMembershipService],
  controllers: [WorkspaceMembershipController]
})
export class WorkspaceMembershipModule {}
