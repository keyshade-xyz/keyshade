import { Test, TestingModule } from '@nestjs/testing'
import { ProjectPermission } from './project.permission'
import { PROJECT_REPOSITORY } from '../repository/interface.repository'
import { MockProjectRepository } from '../repository/mock.repository'

describe('ProjectPermission', () => {
  let service: ProjectPermission

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectPermission,
        { provide: PROJECT_REPOSITORY, useClass: MockProjectRepository }
      ]
    }).compile()

    service = module.get<ProjectPermission>(ProjectPermission)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
