import 'reflect-metadata'
import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested
} from 'class-validator'

export class CreateSecret {
  @IsString()
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
  @Transform(({ value }) => value.trim())
  environmentSlug: string

  @IsString()
  @Transform(({ value }) => value.trim())
  value: string
}
