import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { OAuthStratergyFactory } from './oauth-stratergy.factory'
import { GithubStrategy } from '../oauth-stratergy/github.stratergy'

@Injectable()
export class GithubOAuthStratergyFactory implements OAuthStratergyFactory {
  private clientID: string
  private clientSecret: string
  private callbackURL: string
  private isOAuthEnabled: boolean = false
  constructor(private readonly configService: ConfigService) {
    this.isOAuthEnabled = this.isGithubConfigExsist()
  }

  private isGithubConfigExsist(): boolean {
    this.clientID = this.configService.get<string>('GITHUB_CLIENT_ID')
    this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET')
    this.callbackURL = this.configService.get<string>('GITHUB_CALLBACK_URL')

    return Boolean(this.clientID && this.clientSecret && this.callbackURL)
  }

  private getGithubCredentials() {
    return {
      clientID: this.clientID,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackURL
    }
  }

  public checkIfEnabled(): boolean {
    return this.isOAuthEnabled
  }

  public createOAuthStratergy<T extends typeof PassportStrategy>(): T {
    {
      if (this.isOAuthEnabled) {
        const creds = this.getGithubCredentials()
        return new GithubStrategy(
          creds.clientID,
          creds.clientSecret,
          creds.callbackURL
        ) as unknown as T
      } else {
        Logger.warn(
          'GitHub Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.'
        )
        return null
      }
    }
  }
}
