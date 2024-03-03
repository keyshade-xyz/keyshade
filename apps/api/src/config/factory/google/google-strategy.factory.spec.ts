import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { GoogleStrategy } from '../../oauth-strategy/google/google.strategy'
import { GoogleOAuthStrategyFactory } from './google-strategy.factory'

describe('GoogleOAuthStrategyFactory', () => {
  let factory: GoogleOAuthStrategyFactory
  let configService: ConfigService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [{ provide: ConfigService, useValue: { get: jest.fn() } }]
    }).compile()
    configService = moduleRef.get<ConfigService>(ConfigService)
  })

  it('disable when credentials are not present', () => {
    jest.spyOn(configService, 'get').mockReturnValue('')
    factory = new GoogleOAuthStrategyFactory(configService)
    expect(factory.isOAuthEnabled()).toBe(false)
  })

  it('return null when OAuth disabled', () => {
    const strategy = factory.createOAuthStrategy()
    expect(strategy).toBeNull()
  })

  it('enable OAuth when credentials present', () => {
    jest
      .spyOn(configService, 'get')
      .mockImplementation((key) =>
        key === 'GOOGLE_CLIENT_ID' ||
        key === 'GOOGLE_CLIENT_SECRET' ||
        key === 'GOOGLE_CALLBACK_URL'
          ? 'test'
          : ''
      )
    factory = new GoogleOAuthStrategyFactory(configService)
    expect(factory.isOAuthEnabled()).toBe(true)
  })

  it('create OAuth strategy when enabled', () => {
    const strategy = factory.createOAuthStrategy()
    expect(strategy).toBeInstanceOf(GoogleStrategy)
  })
})
