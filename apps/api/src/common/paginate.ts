export interface PaginatedMetadata {
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

interface QueryOptions {
  page: number
  limit: number
  sort?: string
  order?: string
  search?: string
}

//convert query object to query string to use in links
const getQueryString = (query: QueryOptions) => {
  return Object.keys(query)
    .map((key) => `${key}=${query[key]}`)
    .join('&')
}

export const paginate = (
  totalCount: number,
  relativeUrl: string,
  query: QueryOptions,
  defaultQuery?: Record<string, any>
) => {
  if (!query.limit) return {} as PaginatedMetadata
  let defaultQueryStr = ''
  if (defaultQuery) {
    //sorting entries to make sure the order is consistent and predictable during tests
    const sortedEntries = Object.entries(defaultQuery).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    )
    //ignore keys with undefined values. Undefined values may occur when qury params are optional
    defaultQueryStr = sortedEntries.reduce((res, [key, value]) => {
      if (value !== undefined) {
        res += `${key}=${value}&`
      }
      return res
    }, '')
  }

  const metadata = {} as PaginatedMetadata
  metadata.page = query.page
  metadata.perPage = query.limit
  metadata.pageCount = Math.ceil(totalCount / query.limit)
  metadata.totalCount = totalCount

  if (query.page >= metadata.pageCount) return {} as PaginatedMetadata

  //create links from relativeUrl , defalutQueryStr and query of type QueryOptions
  metadata.links = {
    self: `${relativeUrl}?${defaultQueryStr + getQueryString(query)}`,
    first: `${relativeUrl}?${defaultQueryStr + getQueryString({ ...query, page: 0 })}`,
    previous:
      query.page === 0
        ? null
        : `${relativeUrl}?${defaultQueryStr + getQueryString({ ...query, page: query.page - 1 })}`,
    next:
      query.page === metadata.pageCount - 1
        ? null
        : `${relativeUrl}?${defaultQueryStr + getQueryString({ ...query, page: query.page + 1 })}`,
    last: `${relativeUrl}?${defaultQueryStr + getQueryString({ ...query, page: metadata.pageCount - 1 })}`
  }

  return metadata
}
