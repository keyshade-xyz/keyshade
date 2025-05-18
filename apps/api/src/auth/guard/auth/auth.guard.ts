import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@/decorators/public.decorator'
import { PrismaService } from '@/prisma/prisma.service'
import { ONBOARDING_BYPASSED } from '@/decorators/bypass-onboarding.decorator'
import { AuthenticatedUserContext } from '../../auth.types'
import { EnvSchema } from '@/common/env/env.schema'
import { CacheService } from '@/cache/cache.service'
import { toSHA256 } from '@/common/cryptography'
import { getUserByEmailOrId } from '@/common/user'
import { Request } from 'express'
import { constructErrorBody } from '@/common/util'
import SlugGenerator from '@/common/slug-generator.service'

const X_E2E_USER_EMAIL = 'x-e2e-user-email'
const X_KEYSHADE_TOKEN = 'x-keyshade-token'

// FIXME: Error at line:47 & line:55  process.env.NODE_ENV === 'dev'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
    private readonly slugGenerator: SlugGenerator
  ) {}

  /**
   * This method is called by NestJS every time an HTTP request is made to an endpoint
   * that is protected by this guard. It checks if the request is authenticated and if
   * the user is active. If the user is not active, it throws an UnauthorizedException.
   * If the onboarding is not finished, it throws an UnauthorizedException.
   * @param context The ExecutionContext object that contains information about the
   * request.
   * @returns A boolean indicating if the request is authenticated and the user is active.
   */
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

    let userContext: AuthenticatedUserContext | null = null
    const request = context.switchToHttp().getRequest<Request>()
    const authType = this.getAuthType(request)
    const parsedEnv = EnvSchema.safeParse(process.env)
    let nodeEnv

    if (!parsedEnv.success) {
      nodeEnv = 'dev' // Default to a valid value or handle appropriately
    } else {
      nodeEnv = parsedEnv.data.NODE_ENV
    }

    if (nodeEnv !== 'e2e' && authType === 'NONE') {
      throw new ForbiddenException('No authentication provided')
    }

    // In case the environment is e2e, we want to authenticate the user using the email
    // else we want to authenticate the user using the JWT token.

    if (authType !== 'API_KEY' && nodeEnv === 'e2e') {
      const email = request.headers[X_E2E_USER_EMAIL] as string
      if (!email) {
        throw new ForbiddenException()
      }
      const user = await getUserByEmailOrId(
        email,
        this.prisma,
        this.slugGenerator
      )

      userContext = {
        ...user,
        ipAddress: request.ip
      }
    } else {
      if (authType === 'API_KEY') {
        const apiKeyValue = this.extractApiKeyFromHeader(request)
        if (!apiKeyValue) {
          throw new ForbiddenException('No API key provided')
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
          throw new ForbiddenException('Invalid API key')
        }

        const defaultWorkspace = await this.prisma.workspace.findFirst({
          where: {
            ownerId: apiKey.userId,
            isDefault: true
          }
        })

        userContext = {
          ...apiKey.user,
          defaultWorkspace,
          ipAddress: request.ip
        }
        userContext.isAuthViaApiKey = true
        userContext.apiKeyAuthorities = new Set(apiKey.authorities)
      } else if (authType === 'JWT') {
        const token = this.extractTokenFromCookies(request)
        if (!token) {
          throw new ForbiddenException()
        }
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET
          })

          const cachedUser = await this.cache.getUser(payload['id'])
          if (cachedUser) {
            userContext = {
              ...cachedUser,
              ipAddress: request.ip
            }
          } else {
            const user = await getUserByEmailOrId(
              payload['id'],
              this.prisma,
              this.slugGenerator
            )

            userContext = {
              ...user,
              ipAddress: request.ip
            }
          }
        } catch {
          throw new ForbiddenException()
        }
      } else {
        throw new ForbiddenException('No authentication provided')
      }
    }

    // If the user is not found, we throw a ForbiddenException.
    if (!userContext) {
      throw new ForbiddenException()
    }

    // If the user is not active, we throw an UnauthorizedException.
    if (!userContext.isActive) {
      throw new UnauthorizedException(
        constructErrorBody(
          'User not active',
          'Please contact us if you think this is a mistake'
        )
      )
    }

    const onboardingBypassed =
      this.reflector.getAllAndOverride<boolean>(ONBOARDING_BYPASSED, [
        context.getHandler(),
        context.getClass()
      ]) ?? false

    // If the onboarding is not finished, we throw an UnauthorizedException.
    if (!onboardingBypassed && !userContext.isOnboardingFinished) {
      throw new UnauthorizedException(
        constructErrorBody(
          'Onboarding not finished',
          'Please complete the onboarding'
        )
      )
    }

    // We attach the user to the request object.
    request['user'] = userContext
    return true
  }

  private getAuthType(request: any): 'JWT' | 'API_KEY' | 'NONE' {
    const headers = this.getHeaders(request)
    const cookies = request.cookies
    if (headers[X_KEYSHADE_TOKEN]) {
      return 'API_KEY'
    }
    if (cookies && cookies['token']) {
      return 'JWT'
    }
    return 'NONE'
  }

  private extractTokenFromCookies(request: any): string | undefined {
    const headers = this.getCookies(request)
    const [type, token] = headers.token?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }

  private extractApiKeyFromHeader(request: any): string | undefined {
    const headers = this.getHeaders(request)
    if (Array.isArray(headers[X_KEYSHADE_TOKEN])) {
      throw new ForbiddenException('Bad auth')
    }
    return headers[X_KEYSHADE_TOKEN]
  }

  private getHeaders(request: any): any {
    return request.headers || request.handshake.headers // For websockets
  }

  private getCookies(request: any): any {
    return request.cookies
  }
}
