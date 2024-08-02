import { GetEventsRequest, GetEventsResponse } from '../../types/event.types'
import { APIClient } from '../../core/client'

const baseUrl = ''
export default class EventController {
  private static apiClient = new APIClient(baseUrl)

  static async getEvents(
    request: GetEventsRequest,
    headers?: Record<string, string>
  ): Promise<GetEventsResponse> {
    return this.apiClient.get(
      `/api/event/${request.workspaceId}?source=${request.source}`,
      headers
    )
  }
}
