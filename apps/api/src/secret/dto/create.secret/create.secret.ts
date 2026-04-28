import 'reflect-metadata'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested
} from 'class-validator'
import { ConfigName } from '@/decorators/config-name.decorator'
import { Entry } from '@/common/dto/entry.dto'

export class CreateSecret {
  @ConfigName()
  name: string

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
