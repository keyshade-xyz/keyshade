import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import {
  CancelSubscriptionRequest,
  ClientResponse,
  DownloadAllInvoicesRequest,
  DownloadAllInvoicesResponse,
  DownloadInvoiceRequest,
  DownloadInvoiceResponse,
  DownloadSelectedInvoicesRequest,
  DownloadSelectedInvoicesResponse,
  GeneratePaymentLinkRequest,
  GeneratePaymentLinkResponse,
  GetPaymentHistoryRequest,
  GetPaymentHistoryResponse,
  UpdateSubscriptionRequest
} from '@keyshade/schema'

export default class PaymentController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async generatePaymentLink(
    request: GeneratePaymentLinkRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GeneratePaymentLinkResponse>> {
    const response = await this.apiClient.put(
      `/api/payment-gateway/${request.workspaceSlug}/payment-link`,
      request,
      headers
    )
    return await parseResponse<GeneratePaymentLinkResponse>(response)
  }

  async cancelSubscription(
    request: CancelSubscriptionRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<void>> {
    const response = await this.apiClient.put(
      `/api/payment-gateway/${request.workspaceSlug}/cancel-subscription`,
      request,
      headers
    )
    return await parseResponse<void>(response)
  }

  async uncancelSubscription(
    request: { workspaceSlug: string },
    headers?: Record<string, string>
  ): Promise<ClientResponse<void>> {
    const response = await this.apiClient.put(
      `/api/payment-gateway/${request.workspaceSlug}/uncancel-subscription`,
      request,
      headers
    )
    return await parseResponse<void>(response)
  }

  async updateSubscription(
    request: UpdateSubscriptionRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<void>> {
    const response = await this.apiClient.put(
      `/api/payment-gateway/${request.workspaceSlug}/update-subscription`,
      request,
      headers
    )
    return await parseResponse<void>(response)
  }

  async getPaymentHistory(
    request: GetPaymentHistoryRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetPaymentHistoryResponse>> {
    const response = await this.apiClient.get(
      `/api/payment-gateway/${request.workspaceSlug}/payment-history?page=${request.page}&limit=${request.limit}`,
      headers
    )
    return await parseResponse<GetPaymentHistoryResponse>(response)
  }

  async downloadAllInvoices(
    request: DownloadAllInvoicesRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DownloadAllInvoicesResponse>> {
    const response = await this.apiClient.get(
      `/api/payment-gateway/${request.workspaceSlug}/invoices/all`,
      headers
    )
    return await parseResponse<DownloadAllInvoicesResponse>(response)
  }

  async downloadSelectedInvoices(
    request: DownloadSelectedInvoicesRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DownloadSelectedInvoicesResponse>> {
    const response = await this.apiClient.put(
      `/api/payment-gateway/${request.workspaceSlug}/invoices/selected`,
      request.orderIds,
      headers
    )
    return await parseResponse<DownloadSelectedInvoicesResponse>(response)
  }

  async downloadInvoiceById(
    request: DownloadInvoiceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DownloadInvoiceResponse>> {
    const response = await this.apiClient.get(
      `/api/payment-gateway/${request.workspaceSlug}/invoices/${request.orderId}`,
      headers
    )
    return await parseResponse<DownloadInvoiceResponse>(response)
  }
}
