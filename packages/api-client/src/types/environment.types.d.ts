<<<<<<< HEAD
import { Page } from './index.types'

=======
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
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

export interface GetAllEnvironmentsOfProjectRequest {
  projectSlug: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllEnvironmentsOfProjectResponse {
  items: {
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
  }[]
}

export interface DeleteEnvironmentRequest {
  slug: string
}

export interface DeleteEnvironmentResponse {}
