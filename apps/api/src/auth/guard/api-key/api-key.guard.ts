import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Authority } from '@prisma/client'
import { REQUIRED_API_KEY_AUTHORITIES } from '../../../decorators/required-api-key-authorities.decorator'
import { Observable } from 'rxjs'
import { AuthenticatedUserContext } from '../../auth.types'
import { FORBID_API_KEY } from '../../../decorators/forbid-api-key.decorator'
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) {
      return true
    }

    const requiredAuthorities = this.reflector.get<Authority[]>(
      REQUIRED_API_KEY_AUTHORITIES,
      context.getHandler()
    )

    if (!requiredAuthorities || requiredAuthorities.length === 0) {
      return true
    }

    const user: AuthenticatedUserContext = context
      .switchToHttp()
      .getRequest().user

    if (!user || !user.isAuthViaApiKey) {
      return true
    }

    const forbidApiKey = this.reflector.get<boolean>(
      FORBID_API_KEY,
      context.getHandler()
    )

    if (forbidApiKey && user.isAuthViaApiKey) {
      throw new UnauthorizedException('API key authentication is forbidden.')
    }

    if (!user.apiKeyAuthorities) {
      throw new UnauthorizedException('The API key has no authorities.')
    }

    for (const requiredAuthority of requiredAuthorities) {
      if (!user.apiKeyAuthorities.has(requiredAuthority)) {
        throw new UnauthorizedException(
          `The API key is missing the required authority: ${requiredAuthority}`
        )
      }
    }

    return true
  }
}
