import { subscriptionCancellationReasonEnum } from '@/enums'
import { WorkspaceSchema } from '@/workspace'
import { z } from 'zod'

export const AllowedPlansSchema = z.union([
  z.literal('HACKER'),
  z.literal('TEAM')
])

export const InvoiceSchema = z.object({
  url: z.string().url()
})

export const StatusSchema = z.union([
  z.literal('pending'),
  z.literal('paid', z.literal('refunded')),
  z.literal('partially_refunded')
])

const PurchaseDtoSchema = z.object({
  plan: AllowedPlansSchema,
  seats: z.number().min(1),
  isAnnual: z.boolean()
})

export const GeneratePaymentLinkRequestSchema = PurchaseDtoSchema.extend({
  workspaceSlug: z.string().min(1)
})

export const GeneratePaymentLinkResponseSchema = z.object({
  link: z.string().url()
})

export const PaymentErrorSchema = z.object({
  message: z.string(),
  error: z.string(),
  statusCode: z.number()
})

export const CancelSubscriptionRequestSchema = z.object({
  reason: subscriptionCancellationReasonEnum.optional(),
  comment: z.string().optional(),
  workspaceSlug: z.string().min(1)
})

export const UpdateSubscriptionRequestSchema = PurchaseDtoSchema.extend({
  workspaceSlug: z.string().min(1)
})

export const GetPaymentHistoryRequestSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).default(10).optional(),
  workspaceSlug: z.string().min(1)
})

export const GetPaymentHistoryResponseSchema = z.object({
  items: z.array(
    z.object({
      amount: z.number(),
      date: z.string().datetime(),
      plan: AllowedPlansSchema,
      status: StatusSchema,
      seats: z.number(),
      paid: z.boolean(),
      currency: z.string(),
      orderId: z.string().min(1)
    })
  ),
  metadata: z.object({
    totalCount: z.number(),
    lastPage: z.number()
  })
})

export const DownloadAllInvoicesResponseSchema = z.array(InvoiceSchema)

export const DownloadAllInvoicesRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const DownloadInvoiceRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  orderId: z.string().min(1)
})

export const DownloadInvoiceResponseSchema = InvoiceSchema

export const DownloadSelectedInvoicesRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  orderIds: z.array(z.string().min(1))
})

export const DownloadSelectedInvoicesResponseSchema = z.array(InvoiceSchema)
