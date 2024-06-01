import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../app/app.module'
import { FeedbackService } from '../feedback/service/feedback.service'
import { MockMailService } from '../mail/services/mock.service'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { FeedbackModule } from './feedback.module'
import { MailModule } from '../mail/mail.module'
import { PrismaService } from '../prisma/prisma.service'
import { User } from '@prisma/client'

describe('Feedback Controller (E2E)', () => {
  let app: NestFastifyApplication
  let feedbackService: FeedbackService
  let mockMailService: MockMailService
  let prisma: PrismaService
  let user: User

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, FeedbackModule, MailModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    feedbackService = moduleRef.get(FeedbackService)
    mockMailService = moduleRef.get(MAIL_SERVICE)

    prisma = moduleRef.get(PrismaService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: 'john@keyshade.xyz',
        name: 'John',
        isActive: true,
        isAdmin: false,
        isOnboardingFinished: false
      }
    })
  })

  afterEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(feedbackService).toBeDefined()
    expect(mockMailService).toBeDefined()
    expect(prisma).toBeDefined()
  })

  it('should register feedback successfully', async () => {
    const feedbackMessage = 'Test feedback message'

    const { statusCode } = await app.inject({
      method: 'POST',
      url: '/feedback',
      payload: { feedback: feedbackMessage },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(statusCode).toBe(201)
  })

  it('should handle empty feedback', async () => {
    const { statusCode, payload } = await app.inject({
      method: 'POST',
      url: '/feedback',
      payload: { feedback: '' },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(statusCode).toBe(400)
    expect(JSON.parse(payload)).toEqual({
      error: 'Bad Request',
      message: 'Feedback cannot be null or empty',
      statusCode: 400
    })
  })
})
