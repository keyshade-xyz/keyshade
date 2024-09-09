import { Page } from './index.types'

export interface CreateVariableRequest {
  projectSlug: string
  name: string
  note?: string
  entries?: [
    {
      value: string
      environmentSlug: string
    }
  ]
}

export interface CreateVariableResponse {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  note: string | null
  lastUpdatedById: string
  projectId: string
  project: {
    workspaceId: string
  }
  versions: [
    {
      value: string
      environmentId: string
    }
  ]
}
export interface UpdateVariableRequest {
  variableSlug: string
  name?: string
  entries?: [
    {
      value: string
      environmentSlug: string
    }
  ]
}
export interface UpdateVariableResponse {
  variable: {
    id: string
    name: string
    note: string
    slug: string
  }
  updatedVersions: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface RollBackVariableRequest {
  variableSlug: string
  version: number
  environmentSlug: string
}

export interface RollBackVariableResponse {
  count: string
}

export interface DeleteVariableRequest {
  variableSlug: string
}

export interface DeleteVariableResponse {}

export interface GetAllVariablesOfProjectRequest {
  projectSlug: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllVariablesOfProjectResponse
  extends Page<{
    variable: {
      id: string
      name: string
      slug: string
      createdAt: string
      updatedAt: string
      note: string | null
      lastUpdatedById: string
      projectId: string
      lastUpdatedBy: {
        id: string
        name: string
      }
    }
    values: {
      environment: {
        id: string
        name: string
      }
      value: string
      version: number
    }
  }> {}

export interface GetAllVariablesOfEnvironmentRequest {
  projectSlug: string
  environmentSlug: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export type GetAllVariablesOfEnvironmentResponse = {
  name: string
  value: string
  isPlaintext: boolean
}[]
