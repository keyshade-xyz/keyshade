import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import { ApiKeyModule } from './api-key.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { AppModule } from '@/app/app.module'
import { Test } from '@nestjs/testing'
import { ApiKey, Authority } from '@prisma/client'
import { ApiKeyService } from './service/api-key.service'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/service/user.service'
import { AuthenticatedUser } from '@/user/user.types'

describe('Api Key Role Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let apiKeyService: ApiKeyService
  let userService: UserService

  let user: AuthenticatedUser
  let apiKey: ApiKey

  const USER_IP_ADDRESS = '127.0.0.1'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ApiKeyModule, UserModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    apiKeyService = moduleRef.get(ApiKeyService)
    userService = moduleRef.get(UserService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    const createUser = await userService.createUser({
      email: 'johndoe@keyshade.xyz',
      name: 'John Doe',
      isOnboardingFinished: true
    })

    delete createUser.defaultWorkspace

    user = { ...createUser, ipAddress: USER_IP_ADDRESS }

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

  describe('Create API Key Tests', () => {
    it('should be able to create api key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api-key',
        payload: {
          name: 'Test',
          expiresAfter: '24',
          authorities: ['READ_API_KEY']
        },
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().id).toBeDefined()
      expect(response.json().name).toBe('Test')
      expect(response.json().slug).toBeDefined()
      expect(response.json().value).toMatch(/^ks_*/)
      expect(response.json().preview).toMatch(/^ks_*/)
      expect(response.json().authorities).toEqual(['READ_API_KEY'])

      const last4CharsOfValue = response.json().value.slice(-4)
      const last4CharsOfPreview = response.json().preview.slice(-4)
      expect(last4CharsOfValue).toBe(last4CharsOfPreview)

      const apiKey = await prisma.apiKey.findUnique({
        where: {
          id: response.json().id
        }
      })

      expect(apiKey).toBeDefined()
      expect(apiKey!.name).toBe('Test')
    })

    it('should not be able to create api key with same name', async () => {
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

      expect(response.statusCode).toBe(409)
    })

    it('should not have any authorities if none are provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api-key',
        payload: {
          name: 'Test',
          expiresAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().id).toBeDefined()
      expect(response.json().name).toBe('Test')
      expect(response.json().value).toMatch(/^ks_*/)
      expect(response.json().authorities).toEqual([])
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
  })

  describe('Update API Key Tests', () => {
    it('should not be able to update an api key with the same name', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api-key/${apiKey.slug}`,
        payload: {
          name: 'Test Key',
          expiresAfter: '168'
        },
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should change the slug if the name is updated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api-key/${apiKey.slug}`,
        payload: {
          name: 'Updated Test Key'
        },
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().id).toBe(apiKey.id)
      expect(response.json().name).toBe('Updated Test Key')
      expect(response.json().slug).not.toBe(apiKey.slug)
    })

    it('should be able to update the api key without without changing the authorities', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api-key/${apiKey.slug}`,
        payload: {
          name: 'Updated Test Key'
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
        url: `/api-key/${apiKey.slug}`,
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
  })

  describe('Get API Key Tests', () => {
    it('should be able to get the api key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api-key/${apiKey.slug}`,
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        id: apiKey.id,
        name: 'Test Key',
        slug: apiKey.slug,
        preview: apiKey.preview,
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
  })

  describe('Get All API Keys Tests', () => {
    it('should be able to get all the api keys of the user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api-key',
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items[0].id).toBe(apiKey.id)
      expect(response.json().items[0].name).toBe('Test Key')
      expect(response.json().items[0].slug).toBe(apiKey.slug)
      expect(response.json().items[0].authorities).toEqual([
        'READ_API_KEY',
        'CREATE_ENVIRONMENT'
      ])

      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toBe(
        `/api-key?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toBe(
        `/api-key?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toEqual(null)
      expect(metadata.links.next).toEqual(null)
      expect(metadata.links.last).toBe(
        `/api-key?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should be able to get all api keys using the API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api-key',
        headers: {
          'x-keyshade-token': apiKey.value
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items[0].id).toBe(apiKey.id)
      expect(response.json().items[0].name).toBe('Test Key')
      expect(response.json().items[0].slug).toBe(apiKey.slug)
      expect(response.json().items[0].authorities).toEqual([
        'READ_API_KEY',
        'CREATE_ENVIRONMENT'
      ])
    })
  })

  describe('Access Live Updates Tests', () => {
    it('should be able to access live updates if API key has the required authorities', async () => {
      // Create a new API key with the required authorities
      const newApiKey = await apiKeyService.createApiKey(user, {
        name: 'Test Key 2',
        authorities: [
          Authority.READ_SECRET,
          Authority.READ_VARIABLE,
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT,
          Authority.READ_WORKSPACE
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api-key/access/live-updates',
        headers: {
          'x-keyshade-token': newApiKey.value
        }
      })

      expect(response.statusCode).toBe(200)
    })

    it('should not be able to access live updates if API key does not have the required authorities', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api-key/access/live-updates',
        headers: {
          'x-keyshade-token': apiKey.value
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Delete API Key Tests', () => {
    it('should be able to delete the api key', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api-key/${apiKey.slug}`,
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(204)
    })

    it('should not be able to delete an api key that does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api-key/ks_1234567890`,
        headers: {
          'x-e2e-user-email': user.email
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
