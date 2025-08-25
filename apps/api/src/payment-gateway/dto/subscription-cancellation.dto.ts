import { IsOptional, IsString } from 'class-validator'
import { SubscriptionCancellationReason } from '../payment-gateway.types'

export class SubscriptionCancellation {
  @IsString()
  @IsOptional()
  reason?: SubscriptionCancellationReason

  @IsString()
  @IsOptional()
  comment?: string
}
