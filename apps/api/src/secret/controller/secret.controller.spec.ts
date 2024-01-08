import { Test, TestingModule } from '@nestjs/testing'
import { SecretController } from './secret.controller'
import { PROJECT_REPOSITORY } from '../../project/repository/interface.repository'
import { MockProjectRepository } from '../../project/repository/mock.repository'
import { ENVIRONMENT_REPOSITORY } from '../../environment/repository/interface.repository'
import { MockEnvironmentRepository } from '../../environment/repository/mock.repository'
import { SECRET_REPOSITORY } from '../repository/interface.repository'
import { MockSecretRepository } from '../repository/mock.repository'
import { ProjectPermission } from '../../project/misc/project.permission'
import { ProjectService } from '../../project/service/project.service'
import { USER_REPOSITORY } from '../../user/repository/interface.repository'
import { MockUserRepository } from '../../user/repository/mock.repository'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { SecretService } from '../service/secret.service'

describe('SecretController', () => {
  let controller: SecretController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretController],
      providers: [
        {
          provide: PROJECT_REPOSITORY,
          useClass: MockProjectRepository
        },
        {
          provide: ENVIRONMENT_REPOSITORY,
          useClass: MockEnvironmentRepository
        },
        {
          provide: SECRET_REPOSITORY,
          useClass: MockSecretRepository
        },
        {
          provide: USER_REPOSITORY,
          useClass: MockUserRepository
        },
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        ProjectPermission,
        ProjectService,
        JwtService,
        SecretService
      ]
    }).compile()

    controller = module.get<SecretController>(SecretController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
