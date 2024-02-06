import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-github2'

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(clientID: string, clientSecret: string, callbackURL: string) {
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['public_profile', 'user:email']
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile
  ) {
    return profile
  }
}

// todo: find a better place to keep this
@Injectable()
export class GithubEnvService {
  private clientID: string
  private clientSecret: string
  private callbackURL: string
  constructor(private readonly configService: ConfigService) {}

  isGithubEnabled(): boolean {
    this.clientID = this.configService.get<string>('GITHUB_CLIENT_ID')
    this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET')
    this.callbackURL = this.configService.get<string>('GITHUB_CALLBACK_URL')

    return Boolean(this.clientID && this.clientSecret && this.callbackURL)
  }

  getGithubCredentials() {
    return {
      clientID: this.clientID,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackURL
    }
  }
}
