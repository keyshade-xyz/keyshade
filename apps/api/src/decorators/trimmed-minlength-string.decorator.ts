import { MinLength } from 'class-validator'
import { TrimmedString } from '@/decorators/trimmed-string.decorator'
import { applyDecorators } from '@nestjs/common'

export function TrimmedMinLengthString(min: number) {
  return applyDecorators(TrimmedString(), MinLength(min))
}
