import { GetEventsRequest, GetEventsResponse } from '@package/types/event.types'
import client from '../../client'

export default class EventController {
  private static apiClient = client

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
