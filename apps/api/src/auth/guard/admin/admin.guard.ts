import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { Observable } from 'rxjs'

@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * This guard will check if the request's user is an admin.
   * If the user is an admin, then the canActivate function will return true.
   * If the user is not an admin, then the canActivate function will return false.
   *
   * @param context The ExecutionContext for the request.
   * @returns A boolean indicating whether or not the request's user is an admin.
   */
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const user: User = request.user

    return user.isAdmin
  }
}
