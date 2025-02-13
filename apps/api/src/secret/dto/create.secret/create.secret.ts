import 'reflect-metadata'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested
} from 'class-validator'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'

export class CreateSecret {
  @NonEmptyTrimmedString()
  name: string

  @IsOptional()
  @Length(0, 100)
  @NonEmptyTrimmedString()
  note?: string

  @IsString()
  @IsOptional()
  rotateAfter?: '24' | '168' | '720' | '8760' | 'never' = 'never'

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
