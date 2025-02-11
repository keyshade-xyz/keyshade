import 'reflect-metadata'
import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested
} from 'class-validator'
import { TrimString } from '@/decorators/trim-string.decorator'

export class CreateSecret {
  @IsString()
  @IsNotEmpty()
  @TrimString()
  name: string

  @IsString()
  @IsOptional()
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

class Entry {
  @IsString()
  @IsNotEmpty()
  @TrimString()
  environmentSlug: string

  @IsString()
  @IsNotEmpty()
  @TrimString()
  value: string
}
