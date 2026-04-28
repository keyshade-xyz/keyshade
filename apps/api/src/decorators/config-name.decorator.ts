import { applyDecorators } from '@nestjs/common'
import { Matches, MinLength } from 'class-validator'
import {
  CONFIG_NAME_ERROR_MESSAGE,
  CONFIG_NAME_REGEX
} from '@keyshade/schema/raw'
import { TrimmedString } from '@/decorators/trimmed-string.decorator'

export function ConfigName(minLength?: number) {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [
    TrimmedString(),
    Matches(CONFIG_NAME_REGEX, {
      message: CONFIG_NAME_ERROR_MESSAGE
    })
  ]

  if (minLength) {
    decorators.push(MinLength(minLength))
  }

  return applyDecorators(...decorators)
}
