import { Module } from '@nestjs/common'
import { ProjectService } from './service/project.service'
import { ProjectController } from './controller/project.controller'
import { EnvironmentModule } from '../environment/environment.module'
import { UserModule } from '../user/user.module'
import { SecretModule } from '../secret/secret.module'
import { CommonModule } from '../common/common.module'

@Module({
  providers: [ProjectService],
  controllers: [ProjectController],
  imports: [UserModule, EnvironmentModule, SecretModule, CommonModule]
})
export class ProjectModule {}
