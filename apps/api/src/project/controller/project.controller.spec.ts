import { Test, TestingModule } from '@nestjs/testing'
import { ProjectController } from './project.controller'
import { ProjectService } from '../service/project.service'
import { MockProjectRepository } from '../repository/mock.repository'
import { PROJECT_REPOSITORY } from '../repository/interface.repository'
import { ENVIRONMENT_REPOSITORY } from '../../environment/repository/interface.repository'
import { MockEnvironmentRepository } from '../../environment/repository/mock.repository'
import { USER_REPOSITORY } from '../../user/repository/interface.repository'
import { MockUserRepository } from '../../user/repository/mock.repository'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { ProjectPermission } from '../misc/project.permission'
import { SECRET_REPOSITORY } from '../../secret/repository/interface.repository'
import { MockSecretRepository } from '../../secret/repository/mock.repository'

describe('ProjectController', () => {
  let controller: ProjectController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        ProjectService,
        { provide: PROJECT_REPOSITORY, useClass: MockProjectRepository },
        {
          provide: ENVIRONMENT_REPOSITORY,
          useClass: MockEnvironmentRepository
        },
        { provide: USER_REPOSITORY, useClass: MockUserRepository },
        { provide: MAIL_SERVICE, useClass: MockMailService },
        { provide: SECRET_REPOSITORY, useClass: MockSecretRepository },
        JwtService,
        ProjectPermission
      ]
    }).compile()

    controller = module.get<ProjectController>(ProjectController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
