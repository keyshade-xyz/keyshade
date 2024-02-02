import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { AppModule } from './app.module'

describe('Health Check', () => {
  let app: NestFastifyApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  it(`should pass health check`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/health'
    })
    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual('UP')
  })

  afterAll(async () => {
    await app.close()
  })
})
