import client from '@package/client'
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
} from '@package/types/variable.types'

export default class VariableController {
  private static apiClient = client

  static async createVariable(
    request: CreateVariableRequest,
    headers: Record<string, string>
  ): Promise<CreateVariableResponse> {
    return this.apiClient.post(
      `/api/variable/${request.projectId}`,
      request,
      headers
    )
  }

  static async updateVariable(
    request: UpdateVariableRequest,
    headers: Record<string, string>
  ): Promise<UpdateVariableResponse> {
    return this.apiClient.put(
      `/api/variable/${request.variableId}`,
      request,
      headers
    )
  }

  static async rollbackVariable(
    request: RollBackVariableRequest,
    headers: Record<string, string>
  ): Promise<RollBackVariableResponse> {
    return this.apiClient.put(
      `/api/variable/${request.variableId}/rollback/${request.version}?environmentId=${request.environmentId}`,
      request,
      headers
    )
  }

  static async deleteVariable(
    request: DeleteVariableRequest,
    headers: Record<string, string>
  ): Promise<DeleteVariableResponse> {
    return this.apiClient.delete(`/api/variable/${request.variableId}`, headers)
  }

  static async getAllVariablesOfProject(
    request: GetAllVariablesOfProjectRequest,
    headers: Record<string, string>
  ): Promise<GetAllVariablesOfProjectResponse> {
    let url = `/api/variable/${request.projectId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get(url, headers)
  }

  static async getAllVariablesOfEnvironment(
    request: GetAllVariablesOfEnvironmentRequest,
    headers: Record<string, string>
  ): Promise<GetAllVariablesOfEnvironmentResponse> {
    let url = `/api/variable/${request.projectId}/${request.environmentId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get(url, headers)
  }
}
