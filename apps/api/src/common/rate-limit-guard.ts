import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        message: 'Too many requests. Please try again later.'
      },
      HttpStatus.TOO_MANY_REQUESTS
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context)
  }
}
