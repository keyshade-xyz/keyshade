import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-gitlab2'

@Injectable()
export class GitlabStrategy extends PassportStrategy(Strategy, 'gitlab') {
  constructor(clientID: string, clientSecret: string, callbackURL: string) {
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['read_user']
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile
  ): Promise<Profile> {
    return profile
  }
}
