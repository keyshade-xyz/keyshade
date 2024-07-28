import client from '@package/client'
import {
  CreateVariableRequest,
  CreateVariableResponse,
  DeleteVariableRequest,
  DeleteVariableResponse,
  getAllVariablesOfEnvironmentRequest,
  getAllVariablesOfEnvironmentResponse,
  getAllVariablesOfProjectRequest,
  getAllVariablesOfProjectResponse,
  RollBackVariableRequest,
  RollBackVariableResponse,
  UpdateVariableRequest,
  UpdateVariableResponse
} from '@package/types/variable.types'

export default class VariableController {
  private static apiClient = client

  static async createVariable(
    request: CreateVariableRequest,
    headers: any
  ): Promise<CreateVariableResponse> {
    return this.apiClient.post(
      `/api/variable/${request.projectId}`,
      request,
      headers
    )
  }
  static async updateVariable(
    request: UpdateVariableRequest,
    headers: any
  ): Promise<UpdateVariableResponse> {
    return this.apiClient.put(
      `/api/variable/${request.variableId}`,
      request,
      headers
    )
  }
  static async rollbackVariable(
    request: RollBackVariableRequest,
    headers: any
  ): Promise<RollBackVariableResponse> {
    return this.apiClient.put(
      `/api/variable/${request.variableId}/rollback/${request.version}?environmentId=${request.environmentId}`,
      request,
      headers
    )
  }
  static async deleteVariable(
    request: DeleteVariableRequest,
    headers: any
  ): Promise<DeleteVariableResponse> {
    return this.apiClient.delete(`/api/variable/${request.variableId}`, headers)
  }
  static async getAllVariablesOfProject(
    request: getAllVariablesOfProjectRequest,
    headers: any
  ): Promise<getAllVariablesOfProjectResponse> {
    return this.apiClient.get(`/api/variable/${request.projectId}`, headers)
  }
  static async getAllVariablesOfEnvironment(
    request: getAllVariablesOfEnvironmentRequest,
    headers: any
  ): Promise<getAllVariablesOfEnvironmentResponse> {
    return this.apiClient.get(
      `/api/variable/${request.projectId}/${request.environmentId}`,
      headers
    )
  }
}
