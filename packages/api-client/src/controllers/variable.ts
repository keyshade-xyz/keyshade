import { APIClient } from '@api-client/core/client'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'
import { parseResponse } from '@api-client/core/response-parser'
import {
  ClientResponse,
  DeleteEnvironmentValueOfVariableRequest,
  DeleteEnvironmentValueOfVariableResponse,
  GetAllVariablesOfEnvironmentRequest,
  GetAllVariablesOfEnvironmentResponse
} from '@keyshade/schema'
import {
  CreateVariableRequest,
  CreateVariableResponse,
  BulkCreateVariableRequest,
  BulkCreateVariableResponse,
  DeleteVariableRequest,
  DeleteVariableResponse,
  DisableVariableRequest,
  DisableVariableResponse,
  EnableVariableRequest,
  EnableVariableResponse,
  GetAllDisabledEnvironmentsOfVariableRequest,
  GetAllDisabledEnvironmentsOfVariableResponse,
  GetAllVariablesOfProjectRequest,
  GetAllVariablesOfProjectResponse,
  GetRevisionsOfVariableRequest,
  GetRevisionsOfVariableResponse,
  RollBackVariableRequest,
  RollBackVariableResponse,
  UpdateVariableRequest,
  UpdateVariableResponse
} from '@keyshade/schema'

export default class VariableController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createVariable(
    request: CreateVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateVariableResponse>> {
    const response = await this.apiClient.post(
      `/api/variable/${request.projectSlug}`,
      request,
      headers
    )
    return await parseResponse<CreateVariableResponse>(response)
  }

  async bulkCreateVariables(
    request: BulkCreateVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<BulkCreateVariableResponse>> {
    const response = await this.apiClient.post(
      `/api/variable/${request.projectSlug}/bulk`,
      request,
      headers
    )

    return await parseResponse<BulkCreateVariableResponse>(response)
  }

  async updateVariable(
    request: UpdateVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateVariableResponse>> {
    const response = await this.apiClient.put(
      `/api/variable/${request.variableSlug}`,
      request,
      headers
    )

    return await parseResponse<UpdateVariableResponse>(response)
  }

  async deleteEnvironmentValueOfVariable(
    request: DeleteEnvironmentValueOfVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteEnvironmentValueOfVariableResponse>> {
    const response = await this.apiClient.delete(
      `/api/variable/${request.variableSlug}/${request.environmentSlug}`,
      headers
    )

    return await parseResponse<DeleteVariableResponse>(response)
  }

  async rollbackVariable(
    request: RollBackVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<RollBackVariableResponse>> {
    const response = await this.apiClient.put(
      `/api/variable/${request.variableSlug}/rollback/${request.version}?environmentSlug=${request.environmentSlug}`,
      request,
      headers
    )

    return await parseResponse<RollBackVariableResponse>(response)
  }

  async disableVariable(
    request: DisableVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DisableVariableResponse>> {
    const response = await this.apiClient.put(
      `/api/variable/${request.variableSlug}/disable/${request.environmentSlug}`,
      request,
      headers
    )

    return await parseResponse<DisableVariableResponse>(response)
  }

  async enableVariable(
    request: EnableVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<EnableVariableResponse>> {
    const response = await this.apiClient.put(
      `/api/variable/${request.variableSlug}/enable/${request.environmentSlug}`,
      request,
      headers
    )

    return await parseResponse<EnableVariableResponse>(response)
  }

  async getAllDisabledEnvironmentsOfVariable(
    request: GetAllDisabledEnvironmentsOfVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllDisabledEnvironmentsOfVariableResponse>> {
    const response = await this.apiClient.get(
      `/api/variable/${request.variableSlug}/disabled`,
      headers
    )

    return await parseResponse<GetAllDisabledEnvironmentsOfVariableResponse>(
      response
    )
  }

  async deleteVariable(
    request: DeleteVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteVariableResponse>> {
    const response = await this.apiClient.delete(
      `/api/variable/${request.variableSlug}`,
      headers
    )

    return await parseResponse<DeleteVariableResponse>(response)
  }

  async getAllVariablesOfProject(
    request: GetAllVariablesOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllVariablesOfProjectResponse>> {
    const url = parsePaginationUrl(
      `/api/variable/${request.projectSlug}`,
      request
    )
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllVariablesOfProjectResponse>(response)
  }

  async getRevisionsOfVariable(
    request: GetRevisionsOfVariableRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetRevisionsOfVariableResponse>> {
    const url = parsePaginationUrl(
      `/api/variable/${request.variableSlug}/revisions/${request.environmentSlug}`,
      request
    )
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetRevisionsOfVariableResponse>(response)
  }

  async getAllVariablesOfEnvironment(
    request: GetAllVariablesOfEnvironmentRequest,
    headers: Record<string, string>
  ): Promise<ClientResponse<GetAllVariablesOfEnvironmentResponse>> {
    const url = `/api/variable/${request.projectSlug}/${request.environmentSlug}`
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllVariablesOfEnvironmentResponse>(response)
  }
}
