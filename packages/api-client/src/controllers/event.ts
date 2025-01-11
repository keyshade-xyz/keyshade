import { GetEventsRequest, GetEventsResponse } from '@keyshade/schema'
import { APIClient } from '../core/client'
import { ClientResponse } from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'

export default class EventController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async getEvents(
    request: GetEventsRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetEventsResponse>> {
    const response = await this.apiClient.get(
      `/api/event/${request.workspaceSlug}?source=${request.source}`,
      headers
    )

    return await parseResponse<GetEventsResponse>(response)
  }
}
