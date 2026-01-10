/* eslint-disable @typescript-eslint/no-unused-vars */
import { PaymentGatewayService } from '@/payment-gateway/payment-gateway.service'
import { AuthenticatedUser } from '@/user/user.types'
import { SubscriptionCancellation } from '@/payment-gateway/dto/subscription-cancellation.dto'
import {
  Invoice,
  PaymentHistory
} from '@/payment-gateway/payment-gateway.types'
import { PurchaseDto } from '@/payment-gateway/dto/purchase.dto'
import { Workspace } from '@prisma/client'

export class MockPaymentGatewayService extends PaymentGatewayService {
  cancelSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    cancellationReason: SubscriptionCancellation
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  async downloadAllInvoices(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<Invoice[]> {
    return Promise.resolve([])
  }

  async downloadInvoice(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    orderId: string
  ): Promise<Invoice> {
    return Promise.resolve(undefined)
  }

  async downloadSelectedInvoices(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    orderIds: string[]
  ): Promise<Invoice[]> {
    return Promise.resolve([])
  }

  generatePaymentLink(
    user: AuthenticatedUser,
    dto: PurchaseDto,
    workspaceSlug: Workspace['slug']
  ): Promise<{
    link: string
  }> {
    return Promise.resolve({ link: 'https://example.com' })
  }

  async getPaymentHistory(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number
  ): Promise<PaymentHistory> {
    return Promise.resolve(undefined)
  }

  processWebhook(req: any): Promise<void> {
    return Promise.resolve(undefined)
  }

  async uncancelSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  async updateSubscription(
    user: AuthenticatedUser,
    dto: PurchaseDto,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    return Promise.resolve(undefined)
  }
}
