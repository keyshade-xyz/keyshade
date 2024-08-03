import { GetEventsRequest, GetEventsResponse } from '../../types/event.types'
import { APIClient } from '../../core/client'
import { ClientResponse } from '../../types/index.types'
import { parseResponse } from '../../core/response-parser'

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
      `/api/event/${request.workspaceId}?source=${request.source}`,
      headers
    )
    return await parseResponse<GetEventsResponse>(response)
  }
}
