import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateShare {
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isText: boolean

  @IsString()
  @IsOptional()
  secret?: string

  @IsOptional()
  @IsArray()
  medias?: File[] = []

  @IsOptional()
  @IsString()
  note?: string

  @IsString()
  @IsOptional()
  password?: string

  @IsNumber()
  @Min(1)
  @Max(365)
  expiresAfterDays?: number = 1

  @IsNumber()
  @Min(1)
  @Max(10)
  viewLimit?: number = 1
}
