import { Module } from '@nestjs/common'
import { PaymentGatewayService } from './payment-gateway.service'
import { PaymentGatewayController } from './payment-gateway.controller'
import { PolarPaymentGatewayService } from './polar-payment-gateway.service'
import { MockPaymentGatewayService } from '@/payment-gateway/mock-payment-gateway.service'

@Module({
  providers: [
    {
      provide: PaymentGatewayService,
      useClass:
        // @ts-expect-error -- ignore
        process.env.NODE_ENV === 'e2e'
          ? MockPaymentGatewayService
          : PolarPaymentGatewayService
    }
  ],
  controllers: [PaymentGatewayController]
})
export class PaymentGatewayModule {}
