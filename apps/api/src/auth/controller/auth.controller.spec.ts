import { Test, TestingModule } from '@nestjs/testing'
import { MockAuthRepository } from '../repository/mock.repository'
import { AUTH_REPOSITORY } from '../repository/interface.repository'
import { AuthService } from '../service/auth.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthController } from './auth.controller'
import { USER_REPOSITORY } from '../../user/repository/interface.repository'
import { MockUserRepository } from '../../user/repository/mock.repository'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        { provide: AUTH_REPOSITORY, useClass: MockAuthRepository },
        { provide: USER_REPOSITORY, useClass: MockUserRepository },
        JwtService,
        PrismaService
      ]
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
