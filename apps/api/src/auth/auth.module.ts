import { Global, Module } from '@nestjs/common'
import { AuthService } from './service/auth.service'
import { AuthController } from './auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { UserModule } from '@/user/user.module'
import { GithubStrategy } from '@/config/oauth-strategy/github/github.strategy'
import { GithubOAuthStrategyFactory } from '@/config/factory/github/github-strategy.factory'
import { GoogleOAuthStrategyFactory } from '@/config/factory/google/google-strategy.factory'
import { GoogleStrategy } from '@/config/oauth-strategy/google/google.strategy'
import { GitlabOAuthStrategyFactory } from '@/config/factory/gitlab/gitlab-strategy.factory'
import { GitlabStrategy } from '@/config/oauth-strategy/gitlab/gitlab.strategy'
import { seconds, ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthorizationService } from './service/authorization.service'
import { AuthorityCheckerService } from './service/authority-checker.service'

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'secret',
      signOptions: {
        expiresIn: '30d',
        issuer: 'keyshade.xyz',
        algorithm: 'HS256'
      }
    }),
    UserModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          ttl: seconds(config.get('THROTTLE_TTL')),
          limit: config.get('THROTTLE_LIMIT')
        }
      ],
      inject: [ConfigService]
    })
  ],
  providers: [
    AuthService,
    AuthorizationService,
    AuthorityCheckerService,
    GithubOAuthStrategyFactory,
    {
      provide: GithubStrategy,
      useFactory: (githubOAuthStrategyFactory: GithubOAuthStrategyFactory) => {
        githubOAuthStrategyFactory.createOAuthStrategy()
      },
      inject: [GithubOAuthStrategyFactory]
    },
    GoogleOAuthStrategyFactory,
    {
      provide: GoogleStrategy,
      useFactory: (googleOAuthStrategyFactory: GoogleOAuthStrategyFactory) => {
        googleOAuthStrategyFactory.createOAuthStrategy()
      },
      inject: [GoogleOAuthStrategyFactory]
    },
    GitlabOAuthStrategyFactory,
    {
      provide: GitlabStrategy,
      useFactory: (gitlabOAuthStrategyFactory: GitlabOAuthStrategyFactory) => {
        gitlabOAuthStrategyFactory.createOAuthStrategy()
      },
      inject: [GitlabOAuthStrategyFactory]
    }
  ],
  controllers: [AuthController],
  exports: [AuthorizationService]
})
export class AuthModule {}
