import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuthStrategyFactory } from '../oauth-strategy.factory'
import { GoogleStrategy } from '../../oauth-strategy/google/google.strategy'

@Injectable()
export class GoogleOAuthStrategyFactory implements OAuthStrategyFactory {
  private readonly clientID: string
  private readonly clientSecret: string
  private readonly callbackURL: string

  constructor(private readonly configService: ConfigService) {
    this.clientID = this.configService.get<string>('GOOGLE_CLIENT_ID')
    this.clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')
    this.callbackURL = this.configService.get<string>('GOOGLE_CALLBACK_URL')
  }

  public isOAuthEnabled(): boolean {
    return Boolean(this.clientID && this.clientSecret && this.callbackURL)
  }

  public createOAuthStrategy<GoogleStrategy>(): GoogleStrategy | null {
    if (this.isOAuthEnabled()) {
      return new GoogleStrategy(
        this.clientID,
        this.clientSecret,
        this.callbackURL
      ) as GoogleStrategy
    } else {
      Logger.warn(
        'Google Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.'
      )
      return null
    }
  }
}
