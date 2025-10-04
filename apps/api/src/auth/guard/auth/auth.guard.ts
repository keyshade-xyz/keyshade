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
import { EnvSchema } from '@/common/env/env.schema'
import { UserCacheService } from '@/cache/user-cache.service'
import { getUserByEmailOrId } from '@/common/user'
import { Request } from 'express'
import { constructErrorBody } from '@/common/util'
import SlugGenerator from '@/common/slug-generator.service'
import { HydrationService } from '@/common/hydration.service'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'
import { TokenService } from '@/common/token.service'
import { AuthenticatedUser, UserWithWorkspace } from '@/user/user.types'

const X_E2E_USER_EMAIL = 'x-e2e-user-email'
const X_KEYSHADE_TOKEN = 'x-keyshade-token'

// FIXME: Error at line:47 & line:55  process.env.NODE_ENV === 'dev'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly cache: UserCacheService,
    private readonly slugGenerator: SlugGenerator,
    private readonly hydrationService: HydrationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly tokenService: TokenService
  ) {}

  /**
   * This method called by NestJS every time an HTTP request is made to an endpoint
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

    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromRequest(request)

    const parsedEnv = EnvSchema.safeParse(process.env)
    let nodeEnv: string
    if (!parsedEnv.success) {
      nodeEnv = 'dev' // Default to a valid value or handle appropriately
    } else {
      nodeEnv = parsedEnv.data.NODE_ENV
    }

    if (nodeEnv !== 'e2e' && token === null) {
      throw new ForbiddenException('No authentication provided')
    }

    let user: UserWithWorkspace
    const ipAddress = request.ip

    // In case the environment is e2e, we want to authenticate the user using the email,
    // else we want to authenticate the user using the JWT token.
    if (nodeEnv === 'e2e') {
      const email = request.headers[X_E2E_USER_EMAIL] as string
      if (!email) {
        throw new ForbiddenException()
      }

      user = await getUserByEmailOrId(
        email,
        this.prisma,
        this.slugGenerator,
        this.hydrationService,
        this.workspaceCacheService
      )
    } else {
      const userId = await this.tokenService.validateToken(token)

      const cachedUser = await this.cache.getUser(userId)
      if (cachedUser) {
        user = cachedUser
      } else {
        user = await getUserByEmailOrId(
          userId,
          this.prisma,
          this.slugGenerator,
          this.hydrationService,
          this.workspaceCacheService
        )
        await this.cache.setUser(user)
      }
    }

    // If the user is not active, we throw UnauthorizedException.
    if (!user.isActive) {
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
    if (!onboardingBypassed && !user.isOnboardingFinished) {
      throw new UnauthorizedException(
        constructErrorBody(
          'Onboarding not finished',
          'Please complete the onboarding'
        )
      )
    }

    // We attach the user to the request object.
    request['user'] = {
      ...user,
      ipAddress,

    } as AuthenticatedUser
    return true
  }

  private extractTokenFromRequest(request: any): string | undefined {
    let token: string

    // Check the headers for presence of the X-Keyshade-Token header
    const headers = this.getHeaders(request)
    token = headers[X_KEYSHADE_TOKEN]
    if (token != undefined) return token

    // Check the cookies for presence of the token cookie
    const cookies = this.getCookies(request)
    token = cookies.token
    if (token != undefined) return token
  }

  private getHeaders(request: any): any {
    return request.headers || request.handshake.headers // For websockets
  }

  private getCookies(request: any): any {
    return request.cookies
  }
}
