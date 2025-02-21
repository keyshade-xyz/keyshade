import { IsNotEmpty } from 'class-validator'
import { TrimmedString } from '@/decorators/trimmed-string.decorator'
import { applyDecorators } from '@nestjs/common'

export function NonEmptyTrimmedString() {
  return applyDecorators(TrimmedString(), IsNotEmpty())
}
