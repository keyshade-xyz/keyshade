import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import {
  ClientResponse,
  FinishOnboardingRequest,
  FinishOnboardingResponse
} from '@keyshade/schema'
import {
  GetSelfResponse,
  UpdateSelfRequest,
  UpdateSelfResponse,
  ValidateEmailChangeOTPRequest,
  ValidateEmailChangeOTPResponse,
  ResendEmailChangeOTPRequest,
  DeleteSelfResponse,
  ResendEmailChangeOTPResponse
} from '@keyshade/schema'

export default class UserController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }
  async getSelf(
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetSelfResponse>> {
    const response = await this.apiClient.get(`/api/user`, headers)
    return await parseResponse<GetSelfResponse>(response)
  }

  async updateSelf(
    request: UpdateSelfRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateSelfResponse>> {
    const response = await this.apiClient.put(`/api/user`, request, headers)
    return await parseResponse<UpdateSelfResponse>(response)
  }

  async finishOnboarding(
    request: FinishOnboardingRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<FinishOnboardingResponse>> {
    const response = await this.apiClient.put(
      `/api/user/onboarding`,
      request,
      headers
    )
    return await parseResponse<FinishOnboardingResponse>(response)
  }

  async deleteSelf(
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteSelfResponse>> {
    const response = await this.apiClient.delete(`/api/user`, headers)
    return await parseResponse<DeleteSelfResponse>(response)
  }

  async validateEmailChangeOTP(
    request: ValidateEmailChangeOTPRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ValidateEmailChangeOTPResponse>> {
    const response = await this.apiClient.post(
      `/api/user/validate-email-change-otp?otp=${request.otp}`,
      request,
      headers
    )
    return await parseResponse<ValidateEmailChangeOTPResponse>(response)
  }

  async resendEmailChangeOTP(
    request: ResendEmailChangeOTPRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ResendEmailChangeOTPResponse>> {
    const response = await this.apiClient.post(
      `/api/user/resend-email-change-otp`,
      request,
      headers
    )
    return await parseResponse<ResendEmailChangeOTPResponse>(response)
  }
}
