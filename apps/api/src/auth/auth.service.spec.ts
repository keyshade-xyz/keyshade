import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaRepository } from '../prisma/prisma.repository'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { MAIL_SERVICE } from '../mail/services/mail.service.interface'
import { TestMail } from '../mail/services/fake.mail'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaRepository,
        { provide: MAIL_SERVICE, useClass: TestMail },
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
