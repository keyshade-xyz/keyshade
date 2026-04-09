import { Module } from '@nestjs/common'
import { ProjectService } from './project.service'
import { ProjectController } from './project.controller'
import { EnvironmentModule } from '@/environment/environment.module'
import { UserModule } from '@/user/user.module'
import { SecretModule } from '@/secret/secret.module'
import { VariableModule } from '@/variable/variable.module'
import { ExportService } from './export/export.service'
import { ShareSecretModule } from '@/share-secret/share-secret.module'
@Module({
  providers: [ProjectService, ExportService],
  controllers: [ProjectController],
  imports: [
    UserModule,
    EnvironmentModule,
    SecretModule,
    VariableModule,
    ShareSecretModule
  ]
})
export class ProjectModule {}
