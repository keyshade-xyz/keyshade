<<<<<<< HEAD:packages/api-client/src/controllers/environment.ts
import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
=======
import client from '@package/client'
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts"):packages/api-client/src/controllers/environment/environment.ts
import {
  CreateEnvironmentRequest,
  CreateEnvironmentResponse,
  DeleteEnvironmentRequest,
  DeleteEnvironmentResponse,
  GetAllEnvironmentsOfProjectRequest,
  GetAllEnvironmentsOfProjectResponse,
  GetEnvironmentRequest,
  GetEnvironmentResponse,
  UpdateEnvironmentRequest,
  UpdateEnvironmentResponse
<<<<<<< HEAD:packages/api-client/src/controllers/environment.ts
} from '@api-client/types/environment.types'
import { ClientResponse } from '@api-client/types/index.types'
=======
} from '@package/types/environment.types'
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts"):packages/api-client/src/controllers/environment/environment.ts

export default class EnvironmentController {
  private static apiClient = client

  static async createEnvironment(
    request: CreateEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<CreateEnvironmentResponse> {
    return this.apiClient.post<CreateEnvironmentResponse>(
      `/api/environment/${request.projectId}`,
      request,
      headers
    )
  }

  static async updateEnvironment(
    request: UpdateEnvironmentRequest,
    headers?: Record<string, string>
<<<<<<< HEAD:packages/api-client/src/controllers/environment.ts
  ): Promise<ClientResponse<UpdateEnvironmentResponse>> {
    const response = await this.apiClient.put(
      `/api/environment/${request.slug}`,
=======
  ): Promise<UpdateEnvironmentResponse> {
    return this.apiClient.put<UpdateEnvironmentResponse>(
      `/api/environment/${request.id}`,
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts"):packages/api-client/src/controllers/environment/environment.ts
      request,
      headers
    )
  }

<<<<<<< HEAD:packages/api-client/src/controllers/environment.ts
  async getEnvironment(
    request: GetEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetEnvironmentResponse>> {
    const response = await this.apiClient.get(
      `/api/environment/${request.slug}`,
      headers
    )

    return await parseResponse<GetEnvironmentResponse>(response)
=======
  static async getEnvironmentById(
    request: GetEnvironmentByIdRequest,

    headers?: Record<string, string>
  ): Promise<GetEnvironmentByIdResponse> {
    return this.apiClient.get<GetEnvironmentByIdResponse>(
      `/api/environment/${request.id}`,
      headers
    )
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts"):packages/api-client/src/controllers/environment/environment.ts
  }

  static async getAllEnvironmentsOfProject(
    request: GetAllEnvironmentsOfProjectRequest,
    headers?: Record<string, string>
<<<<<<< HEAD:packages/api-client/src/controllers/environment.ts
  ): Promise<ClientResponse<GetAllEnvironmentsOfProjectResponse>> {
    let url = `/api/environment/all/${request.projectSlug}?`
=======
  ): Promise<GetAllEnvironmentsOfProjectResponse> {
    let url = `/api/environment/all/${request.projectId}?`
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts"):packages/api-client/src/controllers/environment/environment.ts
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)

    return this.apiClient.get<GetAllEnvironmentsOfProjectResponse>(url, headers)
  }

  static async deleteEnvironment(
    request: DeleteEnvironmentRequest,
    headers?: Record<string, string>
<<<<<<< HEAD:packages/api-client/src/controllers/environment.ts
  ): Promise<ClientResponse<DeleteEnvironmentResponse>> {
    const response = await this.apiClient.delete(
      `/api/environment/${request.slug}`,
=======
  ): Promise<DeleteEnvironmentResponse> {
    return this.apiClient.delete<DeleteEnvironmentResponse>(
      `/api/environment/${request.id}`,
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts"):packages/api-client/src/controllers/environment/environment.ts
      headers
    )
  }
}
