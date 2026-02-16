import 'reflect-metadata'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  Length,
  ValidateNested,
  Matches
} from 'class-validator'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'

export class CreateVariable {
  @NonEmptyTrimmedString()
  @Matches(/^[a-zA-Z0-9_]+$/) // Allow alphanumeric characters and underscores
  name: string

  @IsOptional()
  @Matches(/^[\x20-\x7E\n\r\t]*$/) // Allow all printable ASCII characters (plus newlines, carriage returns, and tabs)
  @Length(0, 100)
  note?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Entry)
  entries?: Entry[]
}

class Entry {
  @NonEmptyTrimmedString()
  environmentSlug: string

  @NonEmptyTrimmedString()
  value: string
}
