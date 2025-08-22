import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { PaymentGatewayService } from './payment-gateway.service'
import { AuthenticatedUser } from '@/user/user.types'
import {
  SubscriptionPlanType,
  SubscriptionStatus,
  Workspace
} from '@prisma/client'
import { PurchaseDto } from './dto/purchase.dto'
import {
  AllowedPlans,
  Invoice,
  PaymentHistory,
  PaymentLinkMetadata,
  ProductMetadata
} from './payment-gateway.types'
import {
  MAX_SEAT_PER_PLAN,
  PER_SEAT_PRICE,
  PLAN_NAME_MAP,
  PRODUCT_DESCRIPTION
} from './payment-gateway.constants'
import { constructErrorBody } from '@/common/util'
import { randomUUID } from 'crypto'
import { SubscriptionCancellation } from './dto/subscription-cancellation.dto'
import dayjs from 'dayjs'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Order } from '@polar-sh/sdk/models/components/order'
import { InclusionQuery } from '@/common/inclusion-query'
import { validateEvent } from '@polar-sh/sdk/webhooks'

@Injectable()
export class PolarPaymentGatewayService extends PaymentGatewayService {
  private static readonly EventType = {
    // Used to listen for subscription renewal, subscription upgrade or downgrade, and new subscription
    ORDER_CREATED: 'order.created',
    // Terminate services at the end of billing cycle
    SUBSCRIPTION_CANCELLED: 'subscription.canceled',
    // Reinitiate services
    SUBSCRIPTION_UNCANCELLED: 'subscription.uncanceled',
    // Immediate termination of services
    SUBSCRIPTION_REVOKED: 'subscription.revoked'
  }

  private static readonly OrderBillingReason = {
    SUBSCRIPTION_CREATED: 'subscription_create',
    SUBSCRIPTION_RENEWED: 'subscription_cycle',
    SUBSCRIPTION_UPDATED: 'subscription_update'
  }

  private static readonly SubscriptionStatusMap = {
    incomplete: SubscriptionStatus.INCOMPLETE,
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    cancelled: SubscriptionStatus.CANCELLED,
    unpaid: SubscriptionStatus.UNPAID,
    expired: SubscriptionStatus.CANCELLED
  }

  /**
   * Generate a payment link for a given plan and workspace
   *
   * @param user - The user who is purchasing the plan
   * @param dto - The purchase dto, which contains the plan and seats
   * @param workspaceSlug - The workspace slug
   * @returns A promise with a single object, { link: string }, which contains the payment link
   * @throws UnauthorizedException if the user is not authorized to purchase the plan
   * @throws BadRequestException if the purchase dto is invalid
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public async generatePaymentLink(
    user: AuthenticatedUser,
    dto: PurchaseDto,
    workspaceSlug: Workspace['slug']
  ): Promise<{ link: string }> {
    this.logger.log(
      `User ${user.id} is attempted to purchase ${dto.plan} for workspace ${workspaceSlug}`
    )
    const { id: workspaceId } = await this.validateWorkspaceForNewSubscription(
      user,
      workspaceSlug
    )

    this.logger.log('Generating formatted plan name...')
    const formattedPlanName = this.getFormattedName(
      dto.plan,
      dto.seats,
      dto.isAnnual
    )
    this.logger.log(`Formatted plan name: ${formattedPlanName}`)

    try {
      const productId = await this.getProductIdByName(formattedPlanName, dto)

      const paymentLinkLabel = `${workspaceSlug}_${formattedPlanName}_${randomUUID().slice(0, 6)}`
      this.logger.log(
        `Generating payment link for product ${productId} with label ${paymentLinkLabel}...`
      )
      const { id, url } = await this.polarClient.checkoutLinks.create({
        paymentProcessor: 'stripe',
        products: [productId],
        label: paymentLinkLabel,
        requireBillingAddress: false,
        successUrl: `${process.env.PLATFORM_FRONTEND_URL}/${workspaceSlug}/billing`
      })
      this.logger.log(`Payment link generated with ID: ${id}`)

      // Update the payment link's metadata
      this.logger.log(`Updating payment link metadata...`)
      await this.polarClient.checkoutLinks.update({
        id,
        checkoutLinkUpdate: {
          metadata: {
            workspaceId,
            plan: dto.plan,
            seats: dto.seats,
            isAnnual: dto.isAnnual,
            paymentLinkId: id
          }
        }
      })
      this.logger.log(`Payment link metadata updated`)

      return { link: url }
    } catch (error) {
      this.logger.error(`Error generating payment link: ${error.message}`)
      throw new InternalServerErrorException(
        constructErrorBody(
          'Something went wrong on our end',
          'We encountered an error while processing your payment. Please try again later.'
        )
      )
    }
  }

  /**
   * Cancels a subscription for a workspace.
   * @param user The user who is cancelling the subscription
   * @param workspaceSlug The slug of the workspace to cancel the subscription for
   * @param cancellationReason The cancellation reason
   * @throws UnauthorizedException if the user is not authorized to cancel the subscription
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public async cancelSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    cancellationReason: SubscriptionCancellation
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to cancel subscription for workspace ${workspaceSlug}`
    )

    const workspace = await this.validateWorkspaceForExistingSubscription(
      user,
      workspaceSlug
    )

    if (workspace.subscription.status === SubscriptionStatus.CANCELLED) {
      this.logger.error(
        `Workspace ${workspaceSlug} is already cancelled. No action is required.`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Subscription already cancelled',
          'The subscription for this workspace is already cancelled. No action is required.'
        )
      )
    }

    this.logger.log(`Canceling subscription for workspace ${workspaceSlug}...`)
    await this.polarClient.subscriptions.update({
      id: workspace.subscription.vendorSubscriptionId,
      subscriptionUpdate: {
        cancelAtPeriodEnd: true,
        customerCancellationReason: cancellationReason.reason,
        customerCancellationComment: cancellationReason.comment
      }
    })

    this.logger.log(`Subscription for workspace ${workspaceSlug} cancelled`)
  }

  /**
   * Uncancels a subscription. This means that the subscription will no longer be terminated at the end of the billing cycle.
   *
   * @param user The user who is uncanceling the subscription
   * @param workspaceSlug The workspace slug
   * @returns A promise that resolves when the subscription is uncanceled
   * @throws UnauthorizedException if the user is not authorized to uncancel the subscription
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public async uncancelSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to uncancel subscription for workspace ${workspaceSlug}`
    )

    const workspace = await this.validateWorkspaceForExistingSubscription(
      user,
      workspaceSlug
    )

    if (workspace.subscription.status === SubscriptionStatus.ACTIVE) {
      this.logger.error(
        `Workspace ${workspaceSlug} is already active. No action is required.`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Subscription already active',
          'The subscription for this workspace is already active. No action is required.'
        )
      )
    }

    this.logger.log(
      `Uncanceling subscription for workspace ${workspaceSlug}...`
    )
    await this.polarClient.subscriptions.update({
      id: workspace.subscription.vendorSubscriptionId,
      subscriptionUpdate: {
        cancelAtPeriodEnd: false
      }
    })

    this.logger.log(`Subscription for workspace ${workspaceSlug} uncancelled`)
  }

  /**
   * Updates a workspace's subscription
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @throws {ConflictException} if the workspace does not have an active subscription
   * @throws {InternalServerErrorException} if something went wrong on our end
   * @param user The user performing the request
   * @param dto The subscription update data
   * @param workspaceSlug The slug of the workspace to update the subscription for
   */
  public async updateSubscription(
    user: AuthenticatedUser,
    dto: PurchaseDto,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to update subscription for workspace ${workspaceSlug}`
    )

    const workspace = await this.validateWorkspaceForExistingSubscription(
      user,
      workspaceSlug
    )

    const currentPlanName = this.getFormattedName(
      workspace.subscription.plan as AllowedPlans,
      workspace.subscription.seatsBooked,
      workspace.subscription.isAnnual
    )
    const newPlanName = this.getFormattedName(dto.plan, dto.seats, dto.isAnnual)

    if (currentPlanName === newPlanName) {
      this.logger.error(
        `Workspace ${workspaceSlug} is already on plan ${newPlanName}. No action is required.`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Workspace has the same plan',
          'The workspace is already on the same plan. No action is required.'
        )
      )
    }

    const productId = await this.getProductIdByName(newPlanName, dto)

    // Update the subscription
    this.logger.log(`Updating subscription for workspace ${workspaceSlug}...`)
    await this.polarClient.subscriptions.update({
      id: workspace.subscription.vendorSubscriptionId,
      subscriptionUpdate: {
        productId,
        prorationBehavior: 'invoice'
      }
    })
    this.logger.log(`Subscription updated for workspace ${workspaceSlug}`)
  }

  public async getPaymentHistory(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number
  ): Promise<PaymentHistory> {
    this.logger.log(
      `User ${user.id} attempted to get payment history for workspace ${workspaceSlug}`
    )

    const { id: workspaceId } = await this.getAuthorizedWorkspace(
      user,
      workspaceSlug
    )
    const orders = await this.polarClient.orders.list({
      metadata: { workspaceId },
      page,
      limit
    })

    return {
      items: orders.result.items.map((order) => ({
        amount: order.totalAmount / 100,
        date: order.createdAt,
        plan: order.product.metadata.plan as AllowedPlans,
        status: order.status,
        seats: order.product.metadata.seats as string,
        paid: order.paid,
        currency: order.currency,
        orderId: order.id,
        name: order.product.name
      })),
      metadata: {
        lastPage: orders.result.pagination.maxPage,
        totalCount: orders.result.pagination.totalCount
      }
    }
  }

  public async downloadInvoice(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    orderId: string
  ): Promise<Invoice> {
    this.logger.log(
      `User ${user.id} attempted to download invoice of order ${orderId} in workspace ${workspaceSlug}`
    )

    // Ensure the user has access to the workspace
    this.logger.log(
      `Checking if user is authorized for workspace ${workspaceSlug}...`
    )
    await this.getAuthorizedWorkspace(user, workspaceSlug)

    const order = await this.getOrder(orderId)
    return await this.getInvoiceOfOrder(order)
  }

  public async downloadSelectedInvoices(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    orderIds: string[]
  ): Promise<Invoice[]> {
    this.logger.log(
      `User ${user.id} attempted to download invoices of orders ${orderIds} in workspace ${workspaceSlug}`
    )

    // Ensure the user has access to the workspace
    this.logger.log(
      `Checking if user is authorized for workspace ${workspaceSlug}...`
    )
    await this.getAuthorizedWorkspace(user, workspaceSlug)

    const orders = await Promise.all(
      orderIds.map((orderId) => this.getOrder(orderId))
    )

    return await Promise.all(
      orders.map((order) => this.getInvoiceOfOrder(order))
    )
  }

  public async downloadAllInvoices(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<Invoice[]> {
    this.logger.log(
      `User ${user.id} attempted to download all invoices in workspace ${workspaceSlug}`
    )

    // Ensure the user has access to the workspace
    this.logger.log(
      `Checking if user is authorized for workspace ${workspaceSlug}...`
    )
    const { id: workspaceId } = await this.getAuthorizedWorkspace(
      user,
      workspaceSlug
    )

    const orders: Order[] = []

    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const response = await this.polarClient.orders.list({
        metadata: {
          workspaceId
        },
        page,
        limit: 100
      })
      orders.push(...response.result.items)
      hasNextPage = response.result.pagination.maxPage > page
      page++
    }

    return await Promise.all(
      orders.map((order) => this.getInvoiceOfOrder(order))
    )
  }

  public async processWebhook(req: any): Promise<void> {
    this.logger.log('Processing payment...')
    try {
      const event = validateEvent(
        JSON.stringify(req.body),
        req.headers,
        process.env.POLAR_WEBHOOK_SECRET
      ) as any

      this.logger.log(`Polar caught event type: ${event.type}`)

      switch (event.type) {
        case PolarPaymentGatewayService.EventType.ORDER_CREATED:
          const { data: eventData } = event
          switch (eventData.billingReason) {
            case PolarPaymentGatewayService.OrderBillingReason
              .SUBSCRIPTION_CREATED:
              await this.processSubscriptionCreated(eventData)
              break
            case PolarPaymentGatewayService.OrderBillingReason
              .SUBSCRIPTION_RENEWED:
              await this.processSubscriptionRenewed(eventData)
              break
            case PolarPaymentGatewayService.OrderBillingReason
              .SUBSCRIPTION_UPDATED:
              await this.processSubscriptionUpdated(eventData)
              break
          }
          break
        case PolarPaymentGatewayService.EventType.SUBSCRIPTION_CANCELLED:
          await this.processSubscriptionCancelled(event.data)
          break
        case PolarPaymentGatewayService.EventType.SUBSCRIPTION_UNCANCELLED:
          await this.processSubscriptionUncancelled(event.data)
          break
        case PolarPaymentGatewayService.EventType.SUBSCRIPTION_REVOKED:
          await this.processSubscriptionRevoked(event.data)
          break
      }

      this.logger.log('Polar event processed successfully.')
      // Process the event
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`)
      throw new ForbiddenException(error)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async deleteUnusedPaymentLinks(): Promise<void> {
    this.logger.log('Deleting unused payment links...')

    const { result } = await this.polarClient.checkoutLinks.list({
      sorting: ['-created_at'],
      limit: 50
    })

    this.logger.log(`Found ${result.items.length} payment links`)

    for (const paymentLink of result.items) {
      this.logger.log(`Deleting payment link ${paymentLink.id}...`)
      await this.polarClient.checkoutLinks.delete({
        id: paymentLink.id
      })
      this.logger.log(`Payment link ${paymentLink.id} deleted`)
    }

    this.logger.log('Unused payment links deleted')
  }

  private async processSubscriptionCancelled(data: any): Promise<void> {
    const subscriptionId = data.id

    this.logger.log(
      `Processing subscription cancelled event for subscription ID ${subscriptionId}`
    )

    const { workspaceId } = data.metadata as PaymentLinkMetadata
    this.logger.log(
      `Metadata received for subscription cancellation: ${subscriptionId}`
    )

    // Update the subscription
    this.logger.log(`Cancelling subscription for workspace ${workspaceId}...`)

    const workspace = await this.getWorkspace(workspaceId)

    const subscription = await this.prisma.subscription.update({
      where: {
        workspaceId: workspace.id
      },
      data: {
        status: SubscriptionStatus.CANCELLED
      }
    })
    await this.updateSubscriptionCache(workspace, subscription)

    this.logger.log(`Subscription cancelled for workspace ${workspaceId}`)
  }

  private async processSubscriptionUncancelled(data: any): Promise<void> {
    const subscriptionId = data.id

    this.logger.log(
      `Processing subscription uncancelled event for subscription ID ${subscriptionId}`
    )

    const { workspaceId } = data.metadata as PaymentLinkMetadata
    this.logger.log(
      `Metadata received for subscription uncancellation: ${subscriptionId}`
    )

    // Update the subscription
    this.logger.log(`Uncancelling subscription for workspace ${workspaceId}...`)

    const workspace = await this.getWorkspace(workspaceId)

    const subscription = await this.prisma.subscription.update({
      where: {
        workspaceId: workspace.id
      },
      data: {
        status: SubscriptionStatus.ACTIVE
      }
    })
    await this.updateSubscriptionCache(workspace, subscription)

    this.logger.log(`Subscription uncancelled for workspace ${workspaceId}`)
  }

  private async processSubscriptionRevoked(data: any): Promise<void> {
    const subscriptionId = data.id

    this.logger.log(
      `Processing subscription revoked event for subscription ID ${subscriptionId}`
    )

    const { workspaceId } = data.metadata as PaymentLinkMetadata
    this.logger.log(
      `Metadata received for subscription revokation: ${subscriptionId}`
    )

    // Update the subscription
    this.logger.log(
      `Resetting subscription to free for workspace ${workspaceId}...`
    )

    const workspace = await this.getWorkspace(workspaceId)

    const results = await this.prisma.$transaction([
      // Update subscription
      this.prisma.subscription.update({
        where: {
          workspaceId: workspace.id
        },
        data: {
          plan: SubscriptionPlanType.FREE,
          seatsBooked: 3,
          status: SubscriptionStatus.INCOMPLETE,
          renewsOn: null,
          activatedOn: new Date(),
          vendorCustomerId: null,
          vendorSubscriptionId: null
        }
      }),

      // Update lockdown date of workspace
      this.prisma.workspace.update({
        where: {
          id: workspace.id
        },
        include: InclusionQuery.Workspace,
        data: {
          workspaceLockdownIn: dayjs().add(1, 'month').toDate()
        }
      })
    ])

    await this.updateSubscriptionCache(workspace, results[0])

    this.logger.log(`Subscription reset to free for workspace ${workspaceId}`)
  }

  private async processSubscriptionUpdated(data: any): Promise<void> {
    this.logger.log(
      `Processing subscription updated event for subscription ID ${data.subscriptionId}`
    )

    const productMetadata = data.product.metadata as ProductMetadata
    this.logger.log(
      `Metadata received for subscription: ${JSON.stringify(productMetadata)}`
    )

    // Update the subscription
    this.logger.log('Updating subscription...')
    await this.prisma.subscription.updateMany({
      where: {
        vendorSubscriptionId: data.subscriptionId
      },
      data: {
        renewsOn: data.subscription.currentPeriodEnd,
        seatsBooked: productMetadata.seats,
        isAnnual: productMetadata.isAnnual,
        plan: productMetadata.plan
      }
    })
    const updatedSubscription = await this.prisma.subscription.findFirst({
      where: {
        vendorSubscriptionId: data.subscriptionId
      },
      include: {
        workspace: true
      }
    })
    await this.updateSubscriptionCache(
      updatedSubscription.workspace,
      updatedSubscription
    )
    this.logger.log('Subscription updated successfully')
  }

  private async processSubscriptionCreated(data: any): Promise<void> {
    this.logger.log(
      `Processing subscription created event for subscription ID ${data.subscriptionId}`
    )

    const paymentLinkMetadata = data.metadata as PaymentLinkMetadata
    this.logger.log(
      `Metadata received for subscription: ${JSON.stringify(paymentLinkMetadata)}`
    )

    // Fetch the workspace
    const workspace = await this.getWorkspace(paymentLinkMetadata.workspaceId)

    // Update the subscription
    this.logger.log('Updating subscription...')
    const subscription = await this.prisma.subscription.update({
      where: {
        workspaceId: workspace.id
      },
      data: {
        plan: paymentLinkMetadata.plan,
        seatsBooked: paymentLinkMetadata.seats,
        status:
          PolarPaymentGatewayService.SubscriptionStatusMap[
            data.subscription.status
          ],
        isAnnual: paymentLinkMetadata.isAnnual,
        activatedOn: data.subscription.currentPeriodStart,
        renewsOn: data.subscription.currentPeriodEnd,
        vendorSubscriptionId: data.subscriptionId,
        vendorCustomerId: data.customerId
      }
    })
    this.logger.log('Subscription updated successfully.')

    // Delete the payment link
    this.logger.log(
      `Deleting payment link with ID ${paymentLinkMetadata.paymentLinkId}...`
    )
    await this.polarClient.checkoutLinks.delete({
      id: paymentLinkMetadata.paymentLinkId
    })
    this.logger.log('Payment link deleted successfully.')

    await this.updateSubscriptionCache(workspace, subscription)
  }

  private async processSubscriptionRenewed(data: any): Promise<void> {
    const subscriptionId = data.id

    this.logger.log(
      `Processing subscription renewed event for subscription ID ${subscriptionId}`
    )

    const { workspaceId } = data.metadata as PaymentLinkMetadata
    this.logger.log(
      `Metadata received for subscription renewed: ${subscriptionId}`
    )

    // Update the subscription
    this.logger.log(`Renewing subscription for workspace ${workspaceId}...`)

    const workspace = await this.getWorkspace(workspaceId)

    const subscription = await this.prisma.subscription.update({
      where: {
        workspaceId: workspace.id
      },
      data: {
        renewsOn: data.subscription.currentPeriodEnd
      }
    })

    await this.updateSubscriptionCache(workspace, subscription)
    this.logger.log(`Subscription uncancelled for workspace ${workspaceId}`)
  }

  private getFormattedName(
    plan: AllowedPlans,
    seats: number,
    isAnnual: boolean
  ): string {
    const planName = PLAN_NAME_MAP[plan]
    return `${seats}x ${planName} (${isAnnual ? 'Annually' : 'Monthly'})`
  }

  private getPlanPrice(
    plan: AllowedPlans,
    seats: number,
    isAnnual: boolean
  ): number {
    const basePrice = isAnnual
      ? PER_SEAT_PRICE[plan].annually
      : PER_SEAT_PRICE[plan].monthly
    return (
      (Math.round(
        (seats * basePrice * (isAnnual ? 12 : 1) + Number.EPSILON) * 100
      ) /
        100) *
      100
    )
  }

  private async getWorkspace(id: Workspace['id']): Promise<Workspace> {
    this.logger.log(`Fetching workspace ${id}...`)
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id
      }
    })
    if (!workspace) {
      this.logger.error(`Workspace ${id} not found.`)
      throw new Error(
        `Workspace ${id} not found while processing subscription creation.`
      )
    }
    this.logger.log(`Workspace fetched successfully: ${workspace.name}`)
    return workspace
  }

  /**
   * Creates a product in Polar with the given plan, seats, and interval (annual/monthly).
   * @param plan The plan to create the product for.
   * @param seats The number of seats to book for the plan.
   * @param isAnnual Whether the plan is annual or monthly.
   * @returns The ID of the newly created product.
   * @throws BadRequestException if the number of seats exceeds the maximum allowed for the plan.
   */
  private async createProduct(
    plan: AllowedPlans,
    seats: number,
    isAnnual: boolean
  ): Promise<string> {
    if (seats > MAX_SEAT_PER_PLAN[plan]) {
      throw new BadRequestException('Maximum number of seats exceeded')
    }

    const totalPrice = this.getPlanPrice(plan, seats, isAnnual)
    const formattedPlanName = this.getFormattedName(plan, seats, isAnnual)

    this.logger.log(
      `Creating product with name: ${formattedPlanName} and price: ${totalPrice}`
    )
    const result = await this.polarClient.products.create({
      name: formattedPlanName,
      description: PRODUCT_DESCRIPTION[plan],
      recurringInterval: isAnnual ? 'year' : 'month',
      prices: [
        {
          amountType: 'fixed',
          priceAmount: totalPrice
        }
      ],
      metadata: {
        plan,
        seats,
        isAnnual
      }
    })
    this.logger.log(`Product created with ID: ${result.id}`)
    return result.id
  }

  /**
   * Finds a product in Polar by its name. If the product does not exist, it is created.
   * @param formattedPlanName The name of the product to find or create.
   * @param dto The purchase details.
   * @returns The ID of the product.
   */
  private async getProductIdByName(
    formattedPlanName: string,
    dto: PurchaseDto
  ): Promise<string> {
    this.logger.log(`Checking if product ${formattedPlanName} exists...`)

    const { result } = await this.polarClient.products.list({
      query: formattedPlanName,
      isRecurring: true,
      isArchived: false
    })
    const matchingProducts = result.items
    let productId: string

    if (matchingProducts.length === 0) {
      this.logger.log(
        `Product ${formattedPlanName} does not exist. Creating one...`
      )
      productId = await this.createProduct(dto.plan, dto.seats, dto.isAnnual)
    } else {
      this.logger.log(
        `Product ${formattedPlanName} exists with ID ${productId}. Using it...`
      )
      productId = matchingProducts[0].id
    }

    return productId
  }

  /**
   * Retrieves an invoice for the specified order. If the invoice does not exist yet, it is generated.
   * @param order The order for which to retrieve the invoice
   * @returns A promise with the invoice for the specified order
   */
  private async getInvoiceOfOrder(order: Order): Promise<Invoice> {
    const orderId = order.id

    // Generate the invoice, if not already generated
    if (!order.isInvoiceGenerated) {
      this.logger.log(`Generating invoice for order ${orderId}...`)
      await this.polarClient.orders.generateInvoice({
        id: orderId
      })
    } else {
      this.logger.log(`Invoice already generated for order ${orderId}`)
    }

    // Fetch the invoice from Polar
    this.logger.log(`Fetching invoice for order ${orderId}...`)
    return await this.polarClient.orders.invoice({
      id: orderId
    })
  }

  private async getOrder(orderId: string): Promise<Order> {
    // Fetch the order from Polar
    this.logger.log(`Fetching invoice for order ${orderId}...`)
    const order = await this.polarClient.orders.get({
      id: orderId
    })

    // Ensure the order exists
    if (!order) {
      this.logger.error(`Order ${orderId} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Order not found',
          'The order that you are trying to download does not exist.'
        )
      )
    }

    return order
  }
}
