import { Test, TestingModule } from '@nestjs/testing'
import { ProjectService } from './project.service'
import { PROJECT_REPOSITORY } from '../repository/interface.repository'
import { MockProjectRepository } from '../repository/mock.repository'
import { ENVIRONMENT_REPOSITORY } from '../../environment/repository/interface.repository'
import { MockEnvironmentRepository } from '../../environment/repository/mock.repository'
import { USER_REPOSITORY } from '../../user/repository/interface.repository'
import { MockUserRepository } from '../../user/repository/mock.repository'
import { MockResend } from '../../resend/services/mock.resend'
import { RESEND_SERVICE } from '../../resend/services/resend.service.interface'
import { JwtService } from '@nestjs/jwt'
import { ProjectPermission } from '../misc/project.permission'

describe('ProjectService', () => {
  let service: ProjectService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PROJECT_REPOSITORY, useClass: MockProjectRepository },
        {
          provide: ENVIRONMENT_REPOSITORY,
          useClass: MockEnvironmentRepository
        },
        { provide: USER_REPOSITORY, useClass: MockUserRepository },
        { provide: RESEND_SERVICE, useClass: MockResend },
        ProjectPermission,
        JwtService
      ]
    }).compile()

    service = module.get<ProjectService>(ProjectService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
