import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator'
import { PrismaService } from '../../../prisma/prisma.service'
import { ONBOARDING_BYPASSED } from '../../../decorators/bypass-onboarding.decorator'
import { AuthenticatedUserContext } from '../../auth.types'
import { toSHA256 } from '../../../common/to-sha256'

const X_E2E_USER_EMAIL = 'x-e2e-user-email'
const X_KEYSHADE_TOKEN = 'x-keyshade-token'
const AUTHORIZATION = 'authorization'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the kind of route. Routes marked with the @Public() decorator are public.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    // We don't want to check for authentication if the route is public.
    if (isPublic) {
      return true
    }

    let user: AuthenticatedUserContext | null = null
    const request = context.switchToHttp().getRequest()
    const authType = this.getAuthType(request)

    if (process.env.NODE_ENV !== 'e2e' && authType === 'NONE') {
      throw new ForbiddenException('No authentication provided')
    }

    // In case the environment is e2e, we want to authenticate the user using the email
    // else we want to authenticate the user using the JWT token.
    if (authType !== 'API_KEY' && process.env.NODE_ENV === 'e2e') {
      const email = request.headers[X_E2E_USER_EMAIL]
      if (!email) {
        throw new ForbiddenException()
      }

      user = await this.prisma.user.findUnique({
        where: {
          email
        }
      })
    } else {
      const request = context.switchToHttp().getRequest()

      if (authType === 'API_KEY') {
        const apiKeyValue = this.extractApiKeyFromHeader(request)
        if (!apiKeyValue) {
          throw new ForbiddenException()
        }

        const apiKey = await this.prisma.apiKey.findUnique({
          where: {
            value: toSHA256(apiKeyValue)
          },
          include: {
            user: true
          }
        })

        if (!apiKey) {
          throw new ForbiddenException()
        }

        user = apiKey.user
        user.isAuthViaApiKey = true
        user.apiKeyAuthorities = new Set(apiKey.authorities)
      } else if (authType === 'JWT') {
        const token = this.extractTokenFromHeader(request)
        if (!token) {
          throw new ForbiddenException()
        }
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET
          })

          user = await this.prisma.user.findUnique({
            where: {
              id: payload['id']
            }
          })
        } catch {
          throw new ForbiddenException()
        }
      } else {
        throw new ForbiddenException('No authentication provided')
      }
    }

    // If the user is not found, we throw a ForbiddenException.
    if (!user) {
      throw new ForbiddenException()
    }

    // If the user is not active, we throw an UnauthorizedException.
    if (!user.isActive) {
      throw new UnauthorizedException('User is not active')
    }

    const onboardingBypassed =
      this.reflector.getAllAndOverride<boolean>(ONBOARDING_BYPASSED, [
        context.getHandler(),
        context.getClass()
      ]) ?? false

    // If the onboarding is not finished, we throw an UnauthorizedException.
    if (!onboardingBypassed && !user.isOnboardingFinished) {
      throw new UnauthorizedException('Onboarding not finished')
    }

    // We attach the user to the request object.
    request['user'] = user
    return true
  }

  private getAuthType(request: any): 'JWT' | 'API_KEY' | 'NONE' {
    const headers = request.headers || request.handshake.headers // For websockets
    if (headers[X_KEYSHADE_TOKEN]) {
      return 'API_KEY'
    }
    if (headers[AUTHORIZATION]) {
      return 'JWT'
    }
    return 'NONE'
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const headers = request.headers || request.handshake.headers // For websockets
    const [type, token] = headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }

  private extractApiKeyFromHeader(request: any): string | undefined {
    const headers = request.headers || request.handshake.headers // For websockets
    if (Array.isArray(headers[X_KEYSHADE_TOKEN])) {
      throw new Error('Bad auth')
    }
    return headers[X_KEYSHADE_TOKEN]
  }
}
