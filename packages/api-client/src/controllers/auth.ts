import {
  ClientResponse,
  LogOutRequest,
  LogOutResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  SendOTPRequest,
  SendOTPResponse,
  ValidateOTPRequest,
  ValidateOTPResponse
} from '@keyshade/schema'
import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'

export default class AuthController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  private buildQueryParams(params: {
    mode?: string
    os?: string
    agent?: string
    email?: string
    otp?: string
  }): string {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) query.append(key, value)
    }
    const result = query.toString()
    return result ? `?${result}` : ''
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
    const queryParams = this.buildQueryParams({
      email: request.email,
      otp: request.otp,
      mode: request.mode,
      os: request.os,
      agent: request.agent
    })

    const response = await this.apiClient.post(
      `/api/auth/validate-otp${queryParams}`,
      request,
      headers
    )
    return await parseResponse<ValidateOTPResponse>(response)
  }

  async sendOTP(
    request: SendOTPRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<SendOTPResponse>> {
    const queryParams = this.buildQueryParams({
      mode: request.mode,
      os: request.os,
      agent: request.agent
    })

    const response = await this.apiClient.post(
      `/api/auth/send-otp/${encodeURIComponent(request.email)}${queryParams}`,
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
