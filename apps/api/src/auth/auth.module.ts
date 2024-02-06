import { Logger, Module } from '@nestjs/common'
import { AuthService } from './service/auth.service'
import { AuthController } from './controller/auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { UserModule } from '../user/user.module'
import { GithubEnvService, GithubStrategy } from './github.stratergy'

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1d',
        issuer: 'keyshade.xyz',
        algorithm: 'HS256'
      }
    }),
    UserModule
  ],
  providers: [
    AuthService,
    GithubEnvService,
    {
      provide: GithubStrategy,
      useFactory: (githubEnvService: GithubEnvService) => {
        if (githubEnvService.isGithubEnabled()) {
          const creds = githubEnvService.getGithubCredentials()
          return new GithubStrategy(
            creds.clientID,
            creds.clientSecret,
            creds.callbackURL
          )
        } else {
          Logger.warn('Github Login Is Not Enabled In This Environment')
          return null
        }
      },
      inject: [GithubEnvService]
    }
  ],
  controllers: [AuthController]
})
export class AuthModule {}
