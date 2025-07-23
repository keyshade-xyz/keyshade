import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Authority } from '@prisma/client'
import { REQUIRED_API_KEY_AUTHORITIES } from '@/decorators/required-api-key-authorities.decorator'
import { Observable } from 'rxjs'
import { AuthenticatedUserContext } from '../../auth.types'
import { FORBID_API_KEY } from '@/decorators/forbid-api-key.decorator'
import { IS_PUBLIC_KEY } from '@/decorators/public.decorator'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * This method will check if the user is authenticated via an API key,
   * and if the API key has the required authorities for the route.
   *
   * If the user is not authenticated via an API key, or if the API key does not have the required authorities,
   * then the canActivate method will return true.
   *
   * If the user is authenticated via an API key, and the API key has the required authorities,
   * then the canActivate method will return true.
   *
   * If the user is authenticated via an API key, but the API key does not have the required authorities,
   * then the canActivate method will throw an UnauthorizedException.
   *
   * If the user is authenticated via an API key, but the API key is forbidden for the route,
   * then the canActivate method will throw an UnauthorizedException.
   *
   * @param context The ExecutionContext for the request.
   * @returns A boolean indicating whether or not the user is authenticated via an API key and has the required authorities for the route.
   */
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
      throw new UnauthorizedException(
        constructErrorBody(
          'API Key forbidden',
          'API key authentication is forbidden for this route'
        )
      )
    }

    if (!user.apiKeyAuthorities) {
      throw new UnauthorizedException(
        constructErrorBody(
          'No authorities in API key',
          'The API key has no authorities.'
        )
      )
    }

    if (user.apiKeyAuthorities.has(Authority.ADMIN)) {
      return true
    }

    for (const requiredAuthority of requiredAuthorities) {
      if (!user.apiKeyAuthorities.has(requiredAuthority)) {
        throw new UnauthorizedException(
          constructErrorBody(
            'API Key missing authorities',
            `The API key is missing the required authority: ${requiredAuthority}`
          )
        )
      }
    }

    return true
  }
}
