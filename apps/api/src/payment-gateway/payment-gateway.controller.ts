import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req
} from '@nestjs/common'
import { PaymentGatewayService } from './payment-gateway.service'
import { AuthenticatedUser } from '@/user/user.types'
import { PurchaseDto } from './dto/purchase.dto'
import { Authority, Workspace } from '@prisma/client'
import { CurrentUser } from '@/decorators/user.decorator'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { Public } from '@/decorators/public.decorator'
import { SubscriptionCancellation } from './dto/subscription-cancellation.dto'

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  @Put('/:workspaceSlug/payment-link')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public getPaymentLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PurchaseDto,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.paymentGatewayService.generatePaymentLink(
      user,
      dto,
      workspaceSlug
    )
  }

  @Put('/:workspaceSlug/cancel-subscription')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public cancelSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() dto: SubscriptionCancellation
  ) {
    return this.paymentGatewayService.cancelSubscription(
      user,
      workspaceSlug,
      dto
    )
  }

  @Put('/:workspaceSlug/uncancel-subscription')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public uncancelSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.paymentGatewayService.uncancelSubscription(user, workspaceSlug)
  }

  @Put('/:workspaceSlug/update-subscription')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public updateSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PurchaseDto,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.paymentGatewayService.updateSubscription(
      user,
      dto,
      workspaceSlug
    )
  }

  @Get('/:workspaceSlug/payment-history')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public getPaymentHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Query('page') page: number,
    @Query('limit') limit: number
  ) {
    return this.paymentGatewayService.getPaymentHistory(
      user,
      workspaceSlug,
      page === undefined || page === 0 ? 1 : page,
      limit === undefined || limit === 0 ? 10 : limit
    )
  }

  @Get('/:workspaceSlug/invoices/selected')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public downloadSelectedInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() orderIds: string[]
  ) {
    return this.paymentGatewayService.downloadSelectedInvoices(
      user,
      workspaceSlug,
      orderIds
    )
  }

  @Get('/:workspaceSlug/invoices/all')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public downloadAllInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.paymentGatewayService.downloadAllInvoices(user, workspaceSlug)
  }

  @Get('/:workspaceSlug/invoices/:orderId')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  public downloadInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('orderId') orderId: string
  ) {
    return this.paymentGatewayService.downloadInvoice(
      user,
      workspaceSlug,
      orderId
    )
  }

  @Post('/webhook')
  @Public()
  @HttpCode(202)
  public processPayment(@Req() req: any) {
    return this.paymentGatewayService.processWebhook(req)
  }
}
