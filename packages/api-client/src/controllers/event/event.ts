import { GetEventsRequest, GetEventsResponse } from '@package/types/event.types'
import client from '../../client'

export default class EventController {
  private static apiClient = client

  static async getEvents(
    request: GetEventsRequest,
    headers?: Record<string, string>
  ): Promise<GetEventsResponse> {
    let url = `/api/event/${request.workspaceId}?source=${request.source}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get(url, headers)
  }
}
