import { Module } from '@nestjs/common'
import { ProjectService } from './service/project.service'
import { ProjectController } from './controller/project.controller'
import { EnvironmentModule } from '../environment/environment.module'
import { UserModule } from '../user/user.module'
import { SecretModule } from '../secret/secret.module'

@Module({
  providers: [ProjectService],
  controllers: [ProjectController],
  imports: [UserModule, EnvironmentModule, SecretModule]
})
export class ProjectModule {}
