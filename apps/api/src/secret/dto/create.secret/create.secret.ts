import 'reflect-metadata'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  Matches
} from 'class-validator'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'
import { Entry } from '@/common/dto/entry.dto'

export class CreateSecret {
  @NonEmptyTrimmedString()
  @Matches(/^[a-zA-Z0-9_]+$/)
  name: string

  @IsOptional()
  @Matches(/^[\x20-\x7E\n\r\t]*$/) // Allow all printable ASCII characters (plus newlines, carriage returns, and tabs)
  @Length(0, 100)
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
