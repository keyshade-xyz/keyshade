import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentController } from './environment.controller'
import { EnvironmentService } from '../service/environment.service'
import { ENVIRONMENT_REPOSITORY } from '../repository/interface.repository'
import { MockEnvironmentRepository } from '../repository/mock.repository'
import { MockProjectRepository } from '../../project/repository/mock.repository'
import { PROJECT_REPOSITORY } from '../../project/repository/interface.repository'
import { ProjectPermission } from '../../project/misc/project.permission'

describe('EnvironmentController', () => {
  let controller: EnvironmentController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvironmentController],
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

    controller = module.get<EnvironmentController>(EnvironmentController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
