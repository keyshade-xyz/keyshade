import { z } from 'zod'
import {
  AllowedPlansSchema,
  CancelSubscriptionRequestSchema,
  DownloadAllInvoicesRequestSchema,
  DownloadAllInvoicesResponseSchema,
  DownloadInvoiceRequestSchema,
  DownloadInvoiceResponseSchema,
  DownloadSelectedInvoicesRequestSchema,
  DownloadSelectedInvoicesResponseSchema,
  GeneratePaymentLinkRequestSchema,
  GeneratePaymentLinkResponseSchema,
  GetPaymentHistoryRequestSchema,
  GetPaymentHistoryResponseSchema,
  PaymentErrorSchema,
  StatusSchema,
  UpdateSubscriptionRequestSchema
} from '.'

export type AllowedPlans = z.infer<typeof AllowedPlansSchema>

export type GeneratePaymentLinkRequest = z.infer<
  typeof GeneratePaymentLinkRequestSchema
>

export type GeneratePaymentLinkResponse = z.infer<
  typeof GeneratePaymentLinkResponseSchema
>

export type PaymentError = z.infer<typeof PaymentErrorSchema>

export type CancelSubscriptionRequest = z.infer<
  typeof CancelSubscriptionRequestSchema
>

export type UpdateSubscriptionRequest = z.infer<
  typeof UpdateSubscriptionRequestSchema
>

export type GetPaymentHistoryRequest = z.infer<
  typeof GetPaymentHistoryRequestSchema
>

export type GetPaymentHistoryResponse = z.infer<
  typeof GetPaymentHistoryResponseSchema
>

export type DownloadAllInvoicesRequest = z.infer<
  typeof DownloadAllInvoicesRequestSchema
>
export type DownloadAllInvoicesResponse = z.infer<
  typeof DownloadAllInvoicesResponseSchema
>

export type DownloadInvoiceRequest = z.infer<
  typeof DownloadInvoiceRequestSchema
>

export type DownloadInvoiceResponse = z.infer<
  typeof DownloadInvoiceResponseSchema
>

export type DownloadSelectedInvoicesRequest = z.infer<
  typeof DownloadSelectedInvoicesRequestSchema
>

export type DownloadSelectedInvoicesResponse = z.infer<
  typeof DownloadSelectedInvoicesResponseSchema
>

export type Status = z.infer<typeof StatusSchema>
