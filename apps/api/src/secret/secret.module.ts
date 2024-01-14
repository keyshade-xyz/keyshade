import { Module } from '@nestjs/common'
import { SecretController } from './controller/secret.controller'
import { SecretService } from './service/secret.service'
import { ProjectPermission } from '../project/misc/project.permission'

@Module({
  controllers: [SecretController],
  providers: [SecretService, ProjectPermission]
})
export class SecretModule {}
