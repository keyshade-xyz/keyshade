import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateShareDto {
  @IsString()
  secret: string

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
