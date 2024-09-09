import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import { ClientResponse } from '@api-client/types/index.types'
import {
  CreateVariableRequest,
  CreateVariableResponse,
  DeleteVariableRequest,
  DeleteVariableResponse,
  GetAllVariablesOfEnvironmentRequest,
  GetAllVariablesOfEnvironmentResponse,
  GetAllVariablesOfProjectRequest,
  GetAllVariablesOfProjectResponse,
  RollBackVariableRequest,
  RollBackVariableResponse,
  UpdateVariableRequest,
  UpdateVariableResponse
} from '@api-client/types/variable.types'

export default class VariableController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createVariable(
    request: CreateVariableRequest,
    headers: Record<string, string>
  ): Promise<ClientResponse<CreateVariableResponse>> {
    const response = await this.apiClient.post(
      `/api/variable/${request.projectSlug}`,
      request,
      headers
    )
    return await parseResponse<CreateVariableResponse>(response)
  }

  async updateVariable(
    request: UpdateVariableRequest,
    headers: Record<string, string>
  ): Promise<ClientResponse<UpdateVariableResponse>> {
    const response = await this.apiClient.put(
      `/api/variable/${request.variableSlug}`,
      request,
      headers
    )

    return await parseResponse<UpdateVariableResponse>(response)
  }

  async rollbackVariable(
    request: RollBackVariableRequest,
    headers: Record<string, string>
  ): Promise<ClientResponse<RollBackVariableResponse>> {
    const response = await this.apiClient.put(
      `/api/variable/${request.variableSlug}/rollback/${request.version}?environmentSlug=${request.environmentSlug}`,
      request,
      headers
    )

    return await parseResponse<RollBackVariableResponse>(response)
  }

  async deleteVariable(
    request: DeleteVariableRequest,
    headers: Record<string, string>
  ): Promise<ClientResponse<DeleteVariableResponse>> {
    const response = await this.apiClient.delete(
      `/api/variable/${request.variableSlug}`,
      headers
    )

    return await parseResponse<DeleteVariableResponse>(response)
  }

  async getAllVariablesOfProject(
    request: GetAllVariablesOfProjectRequest,
    headers: Record<string, string>
  ): Promise<ClientResponse<GetAllVariablesOfProjectResponse>> {
    let url = `/api/variable/${request.projectSlug}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllVariablesOfProjectResponse>(response)
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
