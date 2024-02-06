import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../service/auth.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthController } from './auth.controller'
import { mockDeep } from 'jest-mock-extended'
import { GithubEnvService } from '../github.stratergy'
import { ConfigService } from '@nestjs/config'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        GithubEnvService,
        ConfigService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        JwtService,
        PrismaService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
