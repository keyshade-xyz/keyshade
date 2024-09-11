import { Module } from '@nestjs/common'
import { WorkspaceMembershipService } from './service/workspace-membership.service'
import { WorkspaceMembershipController } from './controller/workspace-membership.controller'

@Module({
  providers: [WorkspaceMembershipService],
  controllers: [WorkspaceMembershipController]
})
export class WorkspaceMembershipModule {}
