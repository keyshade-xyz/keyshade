import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User as DBUser } from '@prisma/client'

export const CurrentUser = createParamDecorator<unknown, ExecutionContext, DBUser>(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  }
)
