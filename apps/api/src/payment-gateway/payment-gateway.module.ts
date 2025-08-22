import { Module } from '@nestjs/common'
import { PaymentGatewayService } from './payment-gateway.service'
import { PaymentGatewayController } from './payment-gateway.controller'
import { PolarPaymentGatewayService } from './polar-payment-gateway.service'

@Module({
  providers: [
    {
      provide: PaymentGatewayService,
      useClass: PolarPaymentGatewayService // Currently this is static, might change later on
    }
  ],
  controllers: [PaymentGatewayController]
})
export class PaymentGatewayModule {}
