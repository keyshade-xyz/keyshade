import {
  ResendOTPResponse,
  ResendOTPRequest
} from '@api-client/types/auth.types'
import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import { ClientResponse } from '@api-client/types/index.types'
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
      `/api/auth/resend-otp/${request.userEmail}`,
      request,
      headers
    )
    return await parseResponse<ResendOTPResponse>(response)
  }
}
