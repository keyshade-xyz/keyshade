import { Test, TestingModule } from '@nestjs/testing'
import { MockAuthRepository } from '../repository/mock.repository'
import { AUTH_REPOSITORY } from '../repository/interface.repository'
import { AuthService } from '../service/auth.service'
import { RESEND_SERVICE } from '../../resend/services/resend.service.interface'
import { MockResend } from '../../resend/services/mock.resend'
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
        { provide: RESEND_SERVICE, useClass: MockResend },
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
