import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import {
  ThrottlerGuard,
  ThrottlerStorage,
  ThrottlerModuleOptions
} from '@nestjs/throttler'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name)

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector
  ) {
    super(options, storageService, reflector)
  }

  protected async throwThrottlingException(): Promise<void> {
    this.logger.warn('Rate limit exceeded')

    throw new HttpException(
      {
        message: 'Too many requests. Please try again later.'
      },
      HttpStatus.TOO_MANY_REQUESTS
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Extract user ID if authenticated, else fallback to IP
    const userId = request.user?.id || null
    const ip = request.ip

    // Use user ID if available; otherwise, use IP for rate limiting
    const key = userId ? `user-${userId}` : `ip-${ip}`

    // Logging for debugging purposes
    this.logger.debug(`Rate limiting applied to key: ${key}`)

    // Proceed with rate limiting
    return super.canActivate(context)
  }
}
