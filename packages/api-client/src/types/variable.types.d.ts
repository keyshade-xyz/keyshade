import { PageRequest, PageResponse } from '@keyshade/schema'

export interface Variable {
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
      environment: {
        id: string
        slug: string
      }
    }
  ]
}

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

export interface CreateVariableResponse extends Variable {}

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
  variable: Pick<Variable, 'id' | 'name' | 'slug' | 'note'>
  updatedVersions: [
    {
      value: string
      environmentId: string
      environment: {
        id: string
        slug: string
      }
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
  extends PageResponse<
    Omit<Variable, 'project' | 'versions'> & {
      variable: {
        lastUpdatedBy: {
          id: string
          name: string
        }
      }
      values: {
        environment: {
          id: string
          name: string
          slug: string
        }
        value: string
        version: number
      }[]
    }
  > {}

export interface GetAllVariablesOfEnvironmentRequest {
  projectSlug: string
  environmentSlug: string
}

export type GetAllVariablesOfEnvironmentResponse = {
  name: string
  value: string
  isPlaintext: boolean
}[]

export interface GetRevisionsOfVariableRequest extends Partial<PageRequest> {
  variableSlug: string
  environmentSlug: string
}

export interface GetRevisionsOfVariableResponse
  extends PageResponse<{
    id: string
    value: string
    version: number
    variableId: string
    createdOn: string
    createdById: string
    environmentId: string
  }> {}
