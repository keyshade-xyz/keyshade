import { Test, TestingModule } from '@nestjs/testing'
import { SecretService } from './secret.service'
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

describe('SecretService', () => {
  let service: SecretService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<SecretService>(SecretService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
