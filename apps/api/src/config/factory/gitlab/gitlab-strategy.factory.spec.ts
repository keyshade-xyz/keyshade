import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { GitlabStrategy } from '../../oauth-strategy/gitlab/gitlab.strategy'
import { GitlabOAuthStrategyFactory } from './gitlab-strategy.factory'

describe('GitlabOAuthStrategyFactory', () => {
  let factory: GitlabOAuthStrategyFactory
  let configService: ConfigService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [{ provide: ConfigService, useValue: { get: jest.fn() } }]
    }).compile()
    configService = moduleRef.get<ConfigService>(ConfigService)
  })

  it('should disable OAuth when credentials are not present', () => {
    jest.spyOn(configService, 'get').mockReturnValue('')
    factory = new GitlabOAuthStrategyFactory(configService)
    expect(factory.isOAuthEnabled()).toBe(false)
  })

  it('should return null when OAuth is disabled', () => {
    const strategy = factory.createOAuthStrategy()
    expect(strategy).toBeNull()
  })

  it('should enable OAuth when credentials are present', () => {
    jest
      .spyOn(configService, 'get')
      .mockImplementation((key) =>
        key === 'GITLAB_CLIENT_ID' ||
        key === 'GITLAB_CLIENT_SECRET' ||
        key === 'GITLAB_CALLBACK_URL'
          ? 'test'
          : ''
      )
    factory = new GitlabOAuthStrategyFactory(configService)
    expect(factory.isOAuthEnabled()).toBe(true)
  })

  it('should create OAuth strategy when enabled', () => {
    const strategy = factory.createOAuthStrategy()
    expect(strategy).toBeInstanceOf(GitlabStrategy)
  })
})
