export interface Page<T> {
  items: T[]
  metadata: {
    page: number
    perPage: number
    pageCount: number
    totalCount: number
    links: {
      self: string
      first: string
      previous: string | null
      next: string | null
      last: string
    }
  }
}

export interface ResponseError {
  message: string
  error: string
  statusCode: number
}

export interface ClientResponse<T> {
  success: boolean
  error: ResponseError | null
  data: T | null
}
