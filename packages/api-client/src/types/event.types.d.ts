export interface GetEventsRequest {
  workspaceId: string
  source: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetEventsResponse {}
