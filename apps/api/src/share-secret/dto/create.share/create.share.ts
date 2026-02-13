import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  Matches
} from 'class-validator'

export class CreateShare {
  @IsString()
  @Matches(/^[\x20-\x7E\n\r\t]*$/) // Allow all printable ASCII characters (plus newlines, carriage returns, and tabs)
  secret: string

  @IsString()
  @Matches(/^[\x20-\x7E]*$/) // Allow all printable ASCII characters
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
