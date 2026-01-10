import { IsBoolean, IsNumber, IsString, Min } from 'class-validator'
import { AllowedPlans } from '../payment-gateway.types'

export class PurchaseDto {
  @IsString()
  plan: AllowedPlans

  @IsNumber()
  @Min(1)
  seats: number

  @IsBoolean()
  isAnnual: boolean
}
