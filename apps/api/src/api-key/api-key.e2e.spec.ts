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
import { ApiKeyService } from './service/api-key.service'

describe('Api Key Role Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let apiKeyService: ApiKeyService

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
    apiKeyService = moduleRef.get(ApiKeyService)

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
        isOnboardingFinished: true
      }
    })

    apiKey = await apiKeyService.createApiKey(user, {
      name: 'Test Key',
      expiresAfter: '24',
      authorities: ['READ_API_KEY', 'CREATE_ENVIRONMENT']
    })
  })

  afterEach(async () => {
    await prisma.apiKey.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(apiKeyService).toBeDefined()
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
    expect(response.json().id).toBeDefined()
    expect(response.json().name).toBe('Test Key')
    expect(response.json().value).toMatch(/^ks_*/)
    expect(response.json().authorities).toEqual(['READ_API_KEY'])

    const apiKey = await prisma.apiKey.findUnique({
      where: {
        id: response.json().id
      }
    })

    expect(apiKey).toBeDefined()
    expect(apiKey!.name).toBe('Test Key')
  })

  it('should not have any authorities if none are provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api-key',
      payload: {
        name: 'Test Key 1',
        expiresAfter: '24'
      },
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().id).toBeDefined()
    expect(response.json().name).toBe('Test Key 1')
    expect(response.json().value).toMatch(/^ks_*/)
    expect(response.json().authorities).toEqual([])
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
    expect(response.json().id).toBe(apiKey.id)
    expect(response.json().name).toBe('Updated Test Key')
    expect(response.json().authorities).toEqual([
      'READ_API_KEY',
      'CREATE_ENVIRONMENT'
    ])

    const updatedApiKey = await prisma.apiKey.findUnique({
      where: {
        id: apiKey.id
      }
    })

    expect(updatedApiKey).toBeDefined()
    expect(updatedApiKey!.name).toBe('Updated Test Key')
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
    expect(response.json().id).toBe(apiKey.id)
    expect(response.json().name).toBe('Updated Test Key')
    expect(response.json().authorities).toEqual([
      'READ_API_KEY',
      'CREATE_ENVIRONMENT'
    ])
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
      name: 'Test Key',
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
    expect(response.json()[0].id).toBe(apiKey.id)
    expect(response.json()[0].name).toBe('Test Key')
    expect(response.json()[0].authorities).toEqual([
      'READ_API_KEY',
      'CREATE_ENVIRONMENT'
    ])
  })

  it('should be able to get all api keys using the API key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api-key/all',
      headers: {
        'x-keyshade-token': apiKey.value
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()[0].id).toBe(apiKey.id)
    expect(response.json()[0].name).toBe('Test Key')
    expect(response.json()[0].authorities).toEqual([
      'READ_API_KEY',
      'CREATE_ENVIRONMENT'
    ])
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
        'x-keyshade-token': apiKey.value
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

    expect(response.statusCode).toBe(204)
  })

  afterAll(async () => {
    await app.close()
  })
})
