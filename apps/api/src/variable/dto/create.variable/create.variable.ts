import 'reflect-metadata'
import { Type } from 'class-transformer'
import { IsArray, IsOptional, Length, ValidateNested } from 'class-validator'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'

export class CreateVariable {
  @NonEmptyTrimmedString()
  name: string

  @IsOptional()
  @Length(0, 100)
  @NonEmptyTrimmedString()
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
