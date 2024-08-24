import { Page } from './index.types'

export interface CreateEnvironmentRequest {
  name: string
  description?: string
  projectId: string
}

export interface CreateEnvironmentResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface UpdateEnvironmentRequest {
  id: string
  name?: string
  description?: string
}

export interface UpdateEnvironmentResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface GetEnvironmentByIdRequest {
  id: string
}

export interface GetEnvironmentByIdResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface GetAllEnvironmentsOfProjectRequest {
  projectId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllEnvironmentsOfProjectResponse
  extends Page<{
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
    lastUpdatedBy: {
      id: string
      name: string
      email: string
      profilePictureUrl: string | null
    }
  }> {}

export interface DeleteEnvironmentRequest {
  id: string
}

export interface DeleteEnvironmentResponse {}
