import { PageRequest, PageResponse } from './index.types'

export interface CreateEnvironmentRequest {
  name: string
  description?: string
  projectId: string
}

export interface CreateEnvironmentResponse {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface UpdateEnvironmentRequest {
  slug: string
  name?: string
  description?: string
}

export interface UpdateEnvironmentResponse {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface GetEnvironmentRequest {
  slug: string
}

export interface GetEnvironmentResponse {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface GetAllEnvironmentsOfProjectRequest extends PageRequest {
  projectSlug: string
}

export interface GetAllEnvironmentsOfProjectResponse
  extends PageResponse<{
    id: string
    slug: string
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
  slug: string
}

export interface DeleteEnvironmentResponse {}
