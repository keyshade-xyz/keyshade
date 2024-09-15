import { PageRequest } from '@api-client/types/index.types'

/**
 * Constructs a URL by appending the given page request
 * parameters to the given base URL.
 *
 * @param baseUrl The base URL to append to.
 * @param request The page request to parse.
 * @returns The constructed URL.
 */
export function parsePaginationUrl(
  baseUrl: string,
  request: Partial<PageRequest>
): string {
  let url = `${baseUrl}?`
  request.page && (url += `page=${request.page}&`)
  request.limit && (url += `limit=${request.limit}&`)
  request.sort && (url += `sort=${request.sort}&`)
  request.order && (url += `order=${request.order}&`)
  request.search && (url += `search=${request.search}&`)

  return url
}
