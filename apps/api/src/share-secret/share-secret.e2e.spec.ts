import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { ShareSecretService } from './share-secret.service'
import { Test } from '@nestjs/testing'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { mockDeep } from 'jest-mock-extended'
import { AppModule } from '@/app/app.module'
import { ShareSecretModule } from './share-secret.module'
import { ValidationPipe } from '@nestjs/common'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { PrismaService } from '@/prisma/prisma.service'
import { PrismaModule } from '@/prisma/prisma.module'

describe('Share Secret Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let shareSecretService: ShareSecretService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ShareSecretModule, PrismaModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    shareSecretService = moduleRef.get(ShareSecretService)
    prisma = moduleRef.get(PrismaService)

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true
      }),
      new QueryTransformPipe()
    )

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterEach(async () => {
    await prisma.share.deleteMany()
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
    expect(shareSecretService).toBeDefined()
    expect(prisma).toBeDefined()
  })

  // describe('Create Share Tests', () => {
  //   it('should be able to create a share with no password', async () => {
  //     const response = await app.inject({
  //       method: 'POST',
  //       url: '/share-secret',
  //       payload: {
  //         secret: 'secret'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(201)
  //
  //     const share = await prisma.share.findFirst({
  //       where: {
  //         id: response.json().id
  //       }
  //     })
  //
  //     expect(share).toBeDefined()
  //     expect(share.secret).not.toBe('secret')
  //     expect(share.isPasswordProtected).toBe(false)
  //   })
  //   it('should be able to create a share with password', async () => {
  //     const response = await app.inject({
  //       method: 'POST',
  //       url: '/share-secret',
  //       payload: {
  //         secret: 'secret',
  //         password: 'password'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(201)
  //
  //     const share = await prisma.share.findFirst({
  //       where: {
  //         id: response.json().id
  //       }
  //     })
  //
  //     expect(share).toBeDefined()
  //     expect(share.secret).not.toBe('secret')
  //     expect(share.isPasswordProtected).toBe(true)
  //   })
  //   it('should be able to create the same share with same details twice', async () => {
  //     const response = await app.inject({
  //       method: 'POST',
  //       url: '/share-secret',
  //       payload: {
  //         secret: 'secret',
  //         password: 'password'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(201)
  //
  //     const response2 = await app.inject({
  //       method: 'POST',
  //       url: '/share-secret',
  //       payload: {
  //         secret: 'secret',
  //         password: 'password'
  //       }
  //     })
  //
  //     expect(response2.statusCode).toBe(201)
  //     expect(response2.json().hash).not.toBe(response.json().hash)
  //   })
  // })
  //
  // describe('Add Email To Share Tests', () => {
  //   let share: Omit<ShareResponse, 'secret'>
  //
  //   beforeEach(async () => {
  //     share = await shareSecretService.createShare({
  //       secret: 'secret',
  //       expiresAfterDays: 1,
  //       viewLimit: 1
  //     })
  //   })
  //
  //   it('should be able to add an email to a share', async () => {
  //     const response = await app.inject({
  //       method: 'PUT',
  //       url: `/share-secret/${share.hash}/add-email`,
  //       query: {
  //         email: 'john@keyshade.xyz'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(200)
  //
  //     const updatedShare = await prisma.share.findFirst({
  //       where: {
  //         id: share.id
  //       }
  //     })
  //
  //     expect(updatedShare).toBeDefined()
  //     expect(updatedShare.recepientEmails).toContain('john@keyshade.xyz')
  //   })
  //   it('should be able to add the same email to the same share twice', async () => {
  //     const response = await app.inject({
  //       method: 'PUT',
  //       url: `/share-secret/${share.hash}/add-email`,
  //       query: {
  //         email: 'john@keyshade.xyz'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(200)
  //
  //     const response2 = await app.inject({
  //       method: 'PUT',
  //       url: `/share-secret/${share.hash}/add-email`,
  //       query: {
  //         email: 'john@keyshade.xyz'
  //       }
  //     })
  //
  //     expect(response2.statusCode).toBe(200)
  //
  //     const updatedShare = await prisma.share.findFirst({
  //       where: {
  //         id: share.id
  //       }
  //     })
  //
  //     expect(updatedShare).toBeDefined()
  //     expect(updatedShare.recepientEmails).toHaveLength(1)
  //     expect(updatedShare.recepientEmails).toContain('john@keyshade.xyz')
  //   })
  //   it('should be able to add multiple emails to a share', async () => {
  //     const response = await app.inject({
  //       method: 'PUT',
  //       url: `/share-secret/${share.hash}/add-email`,
  //       query: {
  //         email: 'john@keyshade.xyz'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(200)
  //
  //     const response2 = await app.inject({
  //       method: 'PUT',
  //       url: `/share-secret/${share.hash}/add-email`,
  //       query: {
  //         email: 'jane@keyshade.xyz'
  //       }
  //     })
  //
  //     expect(response2.statusCode).toBe(200)
  //
  //     const updatedShare = await prisma.share.findFirst({
  //       where: {
  //         id: share.id
  //       }
  //     })
  //
  //     expect(updatedShare).toBeDefined()
  //     expect(updatedShare.recepientEmails).toHaveLength(2)
  //     expect(updatedShare.recepientEmails).toContain('john@keyshade.xyz')
  //     expect(updatedShare.recepientEmails).toContain('jane@keyshade.xyz')
  //   })
  //   it('should not be able to add email to a non-existing share', async () => {
  //     const response = await app.inject({
  //       method: 'PUT',
  //       url: `/share-secret/invalid-hash/add-email`,
  //       query: {
  //         email: 'john@keyshade.xyz'
  //       }
  //     })
  //
  //     expect(response.statusCode).toBe(404)
  //   })
  // })
  //
  // describe('Get Share Tests', () => {
  //   it('should get decrypted value for share with no password', async () => {
  //     const share = await shareSecretService.createShare({
  //       secret: 'secret',
  //       expiresAfterDays: 1,
  //       viewLimit: 1
  //     })
  //
  //     const getShareResponse = await app.inject({
  //       method: 'GET',
  //       url: `/share-secret/${share.hash}`
  //     })
  //
  //     expect(getShareResponse.json().secret).toBe('secret')
  //   })
  //   it('should get encrypted value for share with password', async () => {
  //     const share = await shareSecretService.createShare({
  //       secret: 'secret',
  //       password: 'password',
  //       expiresAfterDays: 1,
  //       viewLimit: 1
  //     })
  //
  //     const getShareResponse = await app.inject({
  //       method: 'GET',
  //       url: `/share-secret/${share.hash}`
  //     })
  //
  //     expect(getShareResponse.json().secret).not.toBe('secret')
  //   })
  //   it('should be able to get a share for viewCount number of times', async () => {
  //     const share = await shareSecretService.createShare({
  //       secret: 'secret',
  //       viewLimit: 2,
  //       expiresAfterDays: 1
  //     })
  //
  //     await shareSecretService.getShare(share.hash)
  //     await shareSecretService.getShare(share.hash)
  //
  //     const getShareResponse = await app.inject({
  //       method: 'GET',
  //       url: `/share-secret/${share.hash}`
  //     })
  //
  //     expect(getShareResponse.statusCode).toBe(404)
  //   })
  //   it('should obfuscate a share after viewCount number of times', async () => {
  //     const { hash } = await shareSecretService.createShare({
  //       secret: 'secret',
  //       viewLimit: 2,
  //       expiresAfterDays: 1
  //     })
  //
  //     const share = await prisma.share.findUnique({
  //       where: {
  //         hash
  //       }
  //     })
  //
  //     await shareSecretService.getShare(hash)
  //     await shareSecretService.getShare(hash)
  //
  //     const obfuscatedShare = await prisma.share.findUnique({
  //       where: {
  //         id: share.id
  //       }
  //     })
  //
  //     expect(obfuscatedShare.secret).not.toBe(share.secret)
  //   })
  //   it('should not be able to get a non-existing share', async () => {
  //     const response = await app.inject({
  //       method: 'GET',
  //       url: `/share-secret/invalid-hash`
  //     })
  //
  //     expect(response.statusCode).toBe(404)
  //   })
  // })
})
