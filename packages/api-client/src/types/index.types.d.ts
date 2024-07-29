interface Page<T> {
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
