import { PassportStrategy } from '@nestjs/passport'

export interface OAuthStratergyFactory {
  createOAuthStratergy<T extends typeof PassportStrategy>(): T
}
