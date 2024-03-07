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
import cleanUp from '../common/cleanup'

describe('Api Key Role Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let user: User
  let apiKey: ApiKey
  let apiKeyValue: string

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

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
  })

  it('should be able to create api key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api-key',
      payload: {
        name: 'Test Key',
        expiresAfter: '24',
        authorities: ['READ_API_KEY']
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
      authorities: ['READ_API_KEY'],
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    apiKey = response.json()
    apiKeyValue = response.json().value
  })

  it('should not have any authorities if none are provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api-key',
      payload: {
        name: 'Test Key 2',
        expiresAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: 'Test Key 2',
      value: expect.stringMatching(/^ks_*/),
      authorities: [],
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })
  })

  it('should be able to update the api key without without changing the authorities', async () => {
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
      authorities: ['READ_API_KEY'],
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    apiKey = response.json()
  })

  it('should be able to update the api key with changing the expiry', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/api-key/${apiKey.id}`,
      payload: {
        name: 'Updated Test Key',
        authorities: ['READ_API_KEY', 'CREATE_ENVIRONMENT']
      },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: apiKey.id,
      name: 'Updated Test Key',
      authorities: ['READ_API_KEY', 'CREATE_ENVIRONMENT'],
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })
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
      authorities: ['READ_API_KEY', 'CREATE_ENVIRONMENT'],
      expiresAt: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })
  })

  it('should not be able to get the API key if not exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api-key/ks_1234567890`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(404)
  })

  it('should be able to get all the api keys of the user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api-key/all',
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.arrayContaining([
        {
          id: apiKey.id,
          name: 'Updated Test Key',
          authorities: ['READ_API_KEY', 'CREATE_ENVIRONMENT'],
          expiresAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      ])
    )
  })

  it('should be able to get all api keys using the API key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api-key/all',
      headers: {
        'x-keyshade-token': apiKeyValue
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.arrayContaining([
        {
          id: apiKey.id,
          name: 'Updated Test Key',
          authorities: ['READ_API_KEY', 'CREATE_ENVIRONMENT'],
          expiresAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      ])
    )
  })

  it('should not be able to create api key with invalid authorities of API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api-key',
      payload: {
        name: 'Test Key',
        expiresAfter: '24'
      },
      headers: {
        'x-keyshade-token': apiKeyValue
      }
    })

    expect(response.statusCode).toBe(401)
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
    await cleanUp(prisma)
  })
})
