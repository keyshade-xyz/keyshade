import { Module } from '@nestjs/common'
import { GithubOAuthStratergyFactory } from './factory/github-stratergy.factory'
import { GithubStrategy } from './oauth-stratergy/github.stratergy'

@Module({
  providers: [GithubStrategy],
  exports: [GithubOAuthStratergyFactory, GithubStrategy]
})
export class ConfigModule {}
