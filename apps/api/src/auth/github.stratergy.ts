import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-github2'

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID')
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET')
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL')
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['public_profile', 'user:email']
    })
  }

  async validate(accessToken: string, _refreshToken: string, profile: Profile) {
    return profile
  }
}
