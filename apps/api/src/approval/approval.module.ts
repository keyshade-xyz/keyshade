import { Module } from '@nestjs/common'
import { ApprovalService } from './service/approval.service'
import { ApprovalController } from './controller/approval.controller'
import { WorkspaceService } from '../workspace/service/workspace.service'
import { ProjectService } from '../project/service/project.service'
import { EnvironmentService } from '../environment/service/environment.service'
import { SecretService } from '../secret/service/secret.service'
import { VariableService } from '../variable/service/variable.service'

@Module({
  providers: [
    ApprovalService,
    WorkspaceService,
    ProjectService,
    EnvironmentService,
    SecretService,
    VariableService
  ],
  controllers: [ApprovalController]
})
export class ApprovalModule {}
