import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentService } from './environment.service'
import { ENVIRONMENT_REPOSITORY } from '../repository/interface.repository'
import { MockEnvironmentRepository } from '../repository/mock.repository'
import { PROJECT_REPOSITORY } from '../../project/repository/interface.repository'
import { MockProjectRepository } from '../../project/repository/mock.repository'
import { ProjectPermission } from '../../project/misc/project.permission'

describe('EnvironmentService', () => {
  let service: EnvironmentService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentService,
        {
          provide: ENVIRONMENT_REPOSITORY,
          useClass: MockEnvironmentRepository
        },
        {
          provide: PROJECT_REPOSITORY,
          useClass: MockProjectRepository
        },
        ProjectPermission
      ]
    }).compile()

    service = module.get<EnvironmentService>(EnvironmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
