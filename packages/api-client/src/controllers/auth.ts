import {
  ResendOTPResponse,
  ResendOTPRequest,
  ValidateOTPResponse,
  ValidateOTPRequest,
  SendOTPRequest,
  SendOTPResponse,
  LogOutRequest,
  LogOutResponse
} from '@keyshade/schema'
import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import { ClientResponse } from '@keyshade/schema'

export default class AuthController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async resendOTP(
    request: ResendOTPRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ResendOTPResponse>> {
    const response = await this.apiClient.post(
      `/api/auth/resend-otp/${encodeURIComponent(request.userEmail)}`,
      request,
      headers
    )
    return await parseResponse<ResendOTPResponse>(response)
  }

  async validateOTP(
    request: ValidateOTPRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ValidateOTPResponse>> {
    const response = await this.apiClient.post(
      `/api/auth/validate-otp?email=${request.email}&otp=${request.otp}`,
      request,
      headers
    )
    return await parseResponse<ValidateOTPResponse>(response)
  }

  async sendOTP(
    request: SendOTPRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<SendOTPResponse>> {
    const response = await this.apiClient.post(
      `/api/auth/send-otp/${encodeURIComponent(request.email)}`,
      request,
      headers
    )
    return await parseResponse<SendOTPResponse>(response)
  }

  async logOut(
    request: LogOutRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<LogOutResponse>> {
    const response = await this.apiClient.post(
      '/api/auth/logout',
      request,
      headers
    )
    return await parseResponse<LogOutResponse>(response)
  }
}
