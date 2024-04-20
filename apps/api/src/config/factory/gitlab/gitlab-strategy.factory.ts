import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuthStrategyFactory } from '../oauth-strategy.factory'
import { GitlabStrategy } from '../../oauth-strategy/gitlab/gitlab.strategy'

@Injectable()
export class GitlabOAuthStrategyFactory implements OAuthStrategyFactory {
  private readonly clientID: string
  private readonly clientSecret: string
  private readonly callbackURL: string
  constructor(private readonly configService: ConfigService) {
    this.clientID = this.configService.get<string>('GITLAB_CLIENT_ID')
    this.clientSecret = this.configService.get<string>('GITLAB_CLIENT_SECRET')
    this.callbackURL = this.configService.get<string>('GITLAB_CALLBACK_URL')
  }

  public isOAuthEnabled(): boolean {
    return Boolean(this.clientID && this.clientSecret && this.callbackURL)
  }

  public createOAuthStrategy<GitlabStrategy>(): GitlabStrategy | null {
    if (this.isOAuthEnabled()) {
      return new GitlabStrategy(
        this.clientID,
        this.clientSecret,
        this.callbackURL
      ) as GitlabStrategy
    } else {
      Logger.warn(
        'GitLab Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.'
      )
      return null
    }
  }
}
