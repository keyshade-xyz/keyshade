import { IsString } from 'class-validator'
import { TrimString } from '@/decorators/trim-string.decorator'
import { applyDecorators } from '@nestjs/common'

export function TrimmedString() {
  return applyDecorators(TrimString(), IsString())
}
