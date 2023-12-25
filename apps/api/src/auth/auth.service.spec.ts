import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrimsaRepository } from '../prisma/prisma.repository'
import { TestResend } from '../resend/services/test.resend'
import { RESEND_SERVICE } from '../resend/services/resend.service.interface'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrimsaRepository,
        { provide: RESEND_SERVICE, useClass: TestResend },
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
