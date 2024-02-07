import { Module } from '@nestjs/common'
import { AuthService } from './service/auth.service'
import { AuthController } from './controller/auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { UserModule } from '../user/user.module'
import { GithubStrategy } from '../config/oauth-stratergy/github.stratergy'
import { GithubOAuthStratergyFactory } from '../config/factory/github-stratergy.factory'

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
    GithubOAuthStratergyFactory,
    {
      provide: GithubStrategy,
      useFactory: (githubOAuthStrategyFactory: GithubOAuthStratergyFactory) => {
        githubOAuthStrategyFactory.createOAuthStratergy()
      },
      inject: [GithubOAuthStratergyFactory]
    }
  ],
  controllers: [AuthController]
})
export class AuthModule {}
