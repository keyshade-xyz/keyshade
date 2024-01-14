import { Test, TestingModule } from '@nestjs/testing'
import { ProjectPermission } from './project.permission'
import { PrismaService } from '../../prisma/prisma.service'

describe('ProjectPermission', () => {
  let service: ProjectPermission

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectPermission, PrismaService]
    }).compile()

    service = module.get<ProjectPermission>(ProjectPermission)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
