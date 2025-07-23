import { Module } from '@nestjs/common'
import { ProjectService } from './project.service'
import { ProjectController } from './project.controller'
import { EnvironmentModule } from '@/environment/environment.module'
import { UserModule } from '@/user/user.module'
import { SecretModule } from '@/secret/secret.module'
import { VariableModule } from '@/variable/variable.module'
import { ExportService } from './export/export.service'

@Module({
  providers: [ProjectService, ExportService],
  controllers: [ProjectController],
  imports: [UserModule, EnvironmentModule, SecretModule, VariableModule]
})
export class ProjectModule {}
