import { Page } from './index.types'

export interface CreateVariableRequest {
  projectId: string
  name: string
  note?: string
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface CreateVariableResponse {
  id: string
  name: string
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
  variableId: string
  name?: string
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
}
export interface UpdateVariableResponse {
  variable: {
    id: string
    name: string
    note: string
  }
  updatedVersions: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface RollBackVariableRequest {
  variableId: string
  version: number
  environmentId: string
}

export interface RollBackVariableResponse {
  count: string
}

export interface DeleteVariableRequest {
  variableId: string
}

export interface DeleteVariableResponse {}

export interface GetAllVariablesOfProjectRequest {
  projectId: string
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
  projectId: string
  environmentId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllVariablesOfEnvironmentResponse
  extends Page<{
    name: string
    value: string
    isPlaintext: boolean
  }> {}
