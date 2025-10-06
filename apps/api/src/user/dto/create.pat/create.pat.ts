import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min
} from 'class-validator'

export class CreatePatDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  name: string

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  expiresAfterDays?: number
}
