import { Module } from '@nestjs/common'
import { SecretController } from './controller/secret.controller'
import { SecretService } from './service/secret.service'
import { SECRET_REPOSITORY } from './repository/interface.repository'
import { SecretRepository } from './repository/secret.repository'
import { PROJECT_REPOSITORY } from '../project/repository/interface.repository'
import { ProjectPermission } from '../project/misc/project.permission'
import { ENVIRONMENT_REPOSITORY } from '../environment/repository/interface.repository'
import { EnvironmentRepository } from '../environment/repository/environment.repository'

@Module({
  controllers: [SecretController],
  providers: [
    SecretService,
    {
      provide: SECRET_REPOSITORY,
      useClass: SecretRepository
    },
    {
      provide: PROJECT_REPOSITORY,
      useClass: SecretRepository
    },
    {
      provide: ENVIRONMENT_REPOSITORY,
      useClass: EnvironmentRepository
    },
    ProjectPermission
  ],
  exports: [
    {
      provide: SECRET_REPOSITORY,
      useClass: SecretRepository
    }
  ]
})
export class SecretModule {}
