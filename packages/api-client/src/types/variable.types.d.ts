import { PageRequest, PageResponse } from './index.types'

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

export interface GetAllVariablesOfProjectRequest extends PageRequest {
  projectSlug: string
}

export interface GetAllVariablesOfProjectResponse
  extends PageResponse<{
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

export interface GetAllVariablesOfEnvironmentRequest extends PageRequest {
  projectSlug: string
  environmentSlug: string
}

export type GetAllVariablesOfEnvironmentResponse = {
  name: string
  value: string
  isPlaintext: boolean
}[]
