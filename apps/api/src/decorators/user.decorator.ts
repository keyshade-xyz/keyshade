import { AuthenticatedUser } from '@/user/user.types'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator<
  unknown,
  ExecutionContext,
  AuthenticatedUser
>((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
