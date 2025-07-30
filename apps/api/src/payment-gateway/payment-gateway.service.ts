import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { PurchaseDto } from './dto/purchase.dto'
import { AuthenticatedUser } from '@/user/user.types'
import { Authority, SubscriptionPlanType, Workspace } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import dayjs from 'dayjs'
import { constructErrorBody } from '@/common/util'
import { WorkspaceWithLastUpdatedByAndOwnerAndSubscription } from '@/workspace/workspace.types'
import { POLAR_CLIENT } from '@/provider/polar.provider'
import { Polar } from '@polar-sh/sdk'
import { Invoice, PaymentHistory } from './payment-gateway.types'
import { SubscriptionCancellation } from './dto/subscription-cancellation.dto'

@Injectable()
export abstract class PaymentGatewayService {
  protected readonly logger = new Logger(PaymentGatewayService.name)

  constructor(
    private readonly authorizationService: AuthorizationService,
    protected readonly prisma: PrismaService,
    @Inject(POLAR_CLIENT) protected readonly polarClient: Polar
  ) {}

  /**
   * Generates a payment link for a given plan and workspace
   *
   * @param user The user who is purchasing the plan
   * @param dto The purchase dto, which contains the plan and seats
   * @param workspaceSlug The workspace slug
   * @returns A promise with a single object, { link: string }, which contains the payment link
   * @throws UnauthorizedException if the user is not authorized to purchase the plan
   * @throws BadRequestException if the purchase dto is invalid
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public abstract generatePaymentLink(
    user: AuthenticatedUser,
    dto: PurchaseDto,
    workspaceSlug: Workspace['slug']
  ): Promise<{
    link: string
  }>

  /**
   * Cancels a subscription
   *
   * @param user The user who is cancelling the subscription
   * @param workspaceSlug The workspace slug
   * @returns A promise that resolves when the subscription is cancelled
   * @throws UnauthorizedException if the user is not authorized to cancel the subscription
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public abstract cancelSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    cancellationReason: SubscriptionCancellation
  ): Promise<void>

  /**
   * Uncancels a subscription. This means that the subscription will no longer be terminated at the end of the billing cycle.
   *
   * @param user The user who is uncanceling the subscription
   * @param workspaceSlug The workspace slug
   * @returns A promise that resolves when the subscription is uncanceled
   * @throws UnauthorizedException if the user is not authorized to uncancel the subscription
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public abstract uncancelSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<void>

  /**
   * Updates a workspace's subscription
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @throws {ConflictException} if the workspace does not have an active subscription
   * @throws {InternalServerErrorException} if something went wrong on our end
   * @param user The user performing the request
   * @param dto The subscription update data
   * @param workspaceSlug The slug of the workspace to update the subscription for
   */
  public abstract updateSubscription(
    user: AuthenticatedUser,
    dto: PurchaseDto,
    workspaceSlug: Workspace['slug']
  ): Promise<void>

  /**
   * Retrieves the payment history for a given workspace.
   *
   * @param user The authenticated user requesting the payment history
   * @param workspaceSlug The slug of the workspace for which to retrieve payment history
   * @param page The page number of the payment history to retrieve
   * @param limit The number of records to retrieve per page
   * @returns A promise that resolves to the payment history of the workspace
   * @throws UnauthorizedException if the user does not have the required authority
   * @throws InternalServerErrorException if something goes wrong on our end
   */

  public abstract getPaymentHistory(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number
  ): Promise<PaymentHistory>

  /**
   * Downloads an invoice for a specific order.
   *
   * @param user The authenticated user requesting the invoice
   * @param orderId The ID of the order for which to download the invoice
   * @returns A promise that resolves to the invoice for the specified order
   * @throws UnauthorizedException if the user does not have the required authority to download the invoice
   * @throws NotFoundException if the order or invoice does not exist
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public abstract downloadInvoice(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    orderId: string
  ): Promise<Invoice>

  /**
   * Processes a webhook from external payment gateway
   * @param req The request from the payment gateway
   * @returns A promise that resolves when the webhook is processed
   * @throws InternalServerErrorException if something goes wrong on our end
   */
  public abstract processWebhook(req: any): Promise<void>

  /**
   * Retrieves a workspace by slug if the user has the required authority.
   *
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @param user the user performing the request
   * @param workspaceSlug the slug of the workspace to retrieve
   * @returns the workspace with the given slug
   */
  protected async getAuthorizedWorkspace(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<WorkspaceWithLastUpdatedByAndOwnerAndSubscription> {
    return this.authorizationService.authorizeUserAccessToWorkspace({
      user,
      entity: { slug: workspaceSlug },
      authorities: [Authority.WORKSPACE_ADMIN]
    })
  }

  /**
   * Checks if a workspace already has an active subscription
   * @param user The user to check the workspace for
   * @param workspaceSlug The slug of the workspace to check
   * @throws ConflictException if the workspace already has an active subscription
   * @returns the workspace if it does not have an active subscription
   */
  protected async validateWorkspaceForNewSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<WorkspaceWithLastUpdatedByAndOwnerAndSubscription> {
    const workspace = await this.getAuthorizedWorkspace(user, workspaceSlug)

    if (
      workspace.subscription.plan !== SubscriptionPlanType.FREE &&
      dayjs().isBefore(dayjs(workspace.subscription.renewsOn))
    ) {
      this.logger.error(
        `Workspace ${workspaceSlug} already has an active subscription`
      )
      throw new ConflictException(
        constructErrorBody(
          'Subscription already exists',
          'Workspace already has an active subscription'
        )
      )
    }
    this.logger.log(
      `Workspace ${workspaceSlug} does not have an active subscription`
    )

    return workspace
  }

  /**
   * Checks if a workspace has an active subscription
   * @param user The user to check the workspace for
   * @param workspaceSlug The slug of the workspace to check
   * @throws ConflictException if the workspace does not have an active subscription
   * @returns the workspace if it has an active subscription
   */
  protected async validateWorkspaceForExistingSubscription(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<WorkspaceWithLastUpdatedByAndOwnerAndSubscription> {
    const workspace = await this.getAuthorizedWorkspace(user, workspaceSlug)

    if (workspace.subscription.plan === SubscriptionPlanType.FREE) {
      this.logger.error(
        `Workspace ${workspaceSlug} does not have an active subscription`
      )
      throw new ConflictException(
        constructErrorBody(
          'Subscription does not exist',
          'Workspace does not have an active subscription'
        )
      )
    }
    this.logger.log(`Workspace ${workspaceSlug} has an active subscription`)

    return workspace
  }
}
