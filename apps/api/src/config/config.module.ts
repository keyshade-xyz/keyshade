import { Module } from '@nestjs/common'
import { GithubOAuthStrategyFactory } from './factory/github/github-strategy.factory'
import { GithubStrategy } from './oauth-strategy/github/github.strategy'

@Module({
  providers: [GithubStrategy],
  exports: [GithubOAuthStrategyFactory, GithubStrategy]
})
export class ConfigModule {}
