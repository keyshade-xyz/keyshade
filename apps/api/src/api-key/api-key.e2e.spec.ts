import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import { ApiKeyModule } from './api-key.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { AppModule } from '../app/app.module'
import { Test } from '@nestjs/testing'
import { ApiKey, User } from '@prisma/client'

describe('Api Key Role Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let user: User
  let apiKey: ApiKey

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ApiKeyModule]
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

    await prisma.apiKey.deleteMany()
    await prisma.user.deleteMany()

    user = await prisma.user.create({
      data: {
        email: 'john@keyshade.xyz',
        name: 'John',
        isActive: true,
        isAdmin: false,
        isOnboardingFinished: true
      }
    })
  })

  it('should be able to create api key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api-key',
      payload: {
        name: 'Test Key',
        expiresAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: 'Test Key',
      value: expect.stringMatching(/^ks_*/),
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    apiKey = response.json()
  })

  it('should be able to update the api key', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/api-key/${apiKey.id}`,
      payload: {
        name: 'Updated Test Key',
        expiresAfter: '168'
      },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: apiKey.id,
      name: 'Updated Test Key',
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    apiKey = response.json()
  })

  it('should be able to get the api key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api-key/${apiKey.id}`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: apiKey.id,
      name: 'Updated Test Key',
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })
  })

  it('should be able to get all the api keys of the user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api-key/all/as-user',
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      {
        id: apiKey.id,
        name: 'Updated Test Key',
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ])
  })

  it('should be able to delete the api key', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api-key/${apiKey.id}`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany()
    await prisma.user.deleteMany()

    await prisma.$disconnect()
    await app.close()
  })
})
