import { UserWithWorkspace } from '@/user/user.types'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator<
  unknown,
  ExecutionContext,
  UserWithWorkspace
>((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
