import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { AuthModule } from './auth.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { AppModule } from '../app/app.module'
import { Otp } from '@prisma/client'

describe('Auth Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService

  let otp: Otp

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, AuthModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterEach(async () => {
    await prisma.user.deleteMany()
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
  })

  it('should not send otp if email is blank', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/send-otp/'
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe('Please enter a valid email address')
  })

  it('should not send otp if email is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/send-otp/abcdef'
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe('Please enter a valid email address')
  })

  it('should send otp if email is valid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/send-otp/johndoe@keyshade.xyz'
    })

    expect(response.statusCode).toBe(201)
  })

  it('should have generated an otp', async () => {
    otp = await prisma.otp.findFirst({
      where: {
        user: {
          email: 'johndoe@keyshade.xyz'
        }
      }
    })

    expect(otp).toBeDefined()
    expect(otp.code).toBeDefined()
    expect(otp.expiresAt).toBeDefined()
    expect(otp.code.length).toBe(6)
  })

  it('should upsert otp if regenerated', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/send-otp/johndoe@keyshade.xyz'
    })

    const regenerated = await prisma.otp.findFirst({
      where: {
        user: {
          email: 'johndoe@keyshade.xyz'
        }
      }
    })

    expect(regenerated).toBeDefined()
    expect(regenerated.code).toBeDefined()
    expect(regenerated.expiresAt).toBeDefined()
    expect(regenerated.code.length).toBe(6)
    expect(regenerated.code).not.toBe(otp.code)

    otp = regenerated
  })

  it('should not be able to validate otp with invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/validate-otp?email=abcdef&otp=123456'
    })

    expect(response.statusCode).toBe(404)
  })

  it('should not be able to validate otp with invalid otp', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/validate-otp?email=johndoe@keyshade.xyz&otp=123456'
    })

    expect(response.statusCode).toBe(401)
  })
})
