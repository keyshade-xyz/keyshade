import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuthStrategyFactory } from '../oauth-strategy.factory'
import { GithubStrategy } from '../../oauth-strategy/github/github.strategy'

@Injectable()
export class GithubOAuthStrategyFactory implements OAuthStrategyFactory {
  private readonly clientID: string
  private readonly clientSecret: string
  private readonly callbackURL: string
  constructor(private readonly configService: ConfigService) {
    this.clientID = this.configService.get<string>('GITHUB_CLIENT_ID')
    this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET')
    this.callbackURL = this.configService.get<string>('GITHUB_CALLBACK_URL')
  }

  public isOAuthEnabled(): boolean {
    return Boolean(this.clientID && this.clientSecret && this.callbackURL)
  }

  public createOAuthStrategy<GithubStrategy>(): GithubStrategy | null {
    const logger = new Logger(GithubOAuthStrategyFactory.name)

    logger.log('Creating GitHub OAuth Strategy...')
    if (this.isOAuthEnabled()) {
      logger.log('GitHub OAuth Strategy created successfully.')
      return new GithubStrategy(
        this.clientID,
        this.clientSecret,
        this.callbackURL
      ) as GithubStrategy
    } else {
      logger.error(
        'GitHub Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.'
      )
      return null
    }
  }
}
