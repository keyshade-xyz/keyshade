import { PageRequest, PageResponse } from './index.types'

export interface Environment {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  projectId: string
}

export interface CreateEnvironmentRequest {
  name: string
  description?: string
  projectId: string
}

export interface CreateEnvironmentResponse extends Environment {}

export interface UpdateEnvironmentRequest
  extends Partial<Omit<CreateEnvironmentRequest, 'projectId'>> {
  slug: string
}

export interface UpdateEnvironmentResponse extends Environment {}

export interface GetEnvironmentRequest {
  slug: string
}

export interface GetEnvironmentResponse extends Environment {}

export interface GetAllEnvironmentsOfProjectRequest extends PageRequest {
  projectSlug: string
}

export interface GetAllEnvironmentsOfProjectResponse
  extends PageResponse<
    Environment & {
      lastUpdatedBy: {
        id: string
        name: string
        email: string
        profilePictureUrl: string | null
      }
    }
  > {}

export interface DeleteEnvironmentRequest {
  slug: string
}

export interface DeleteEnvironmentResponse {}
