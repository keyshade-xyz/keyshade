import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { MockMailService } from '../../mail/services/mock.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { AUTH_REPOSITORY } from '../repository/interface.repository'
import { MockAuthRepository } from '../repository/mock.repository'
import { USER_REPOSITORY } from '../../user/repository/interface.repository'
import { MockUserRepository } from '../../user/repository/mock.repository'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        { provide: AUTH_REPOSITORY, useClass: MockAuthRepository },
        { provide: USER_REPOSITORY, useClass: MockUserRepository },
        JwtService,
        PrismaService
      ]
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
