import { paginate } from './paginate'

describe('paginate', () => {
  it('should paginate without default query', () => {
    const totalCount = 100
    const relativeUrl = '/items'
    const query = { page: 2, limit: 10 }

    const result = paginate(totalCount, relativeUrl, query)

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        page: 2,
        perPage: 10,
        pageCount: 10,
        totalCount: 100
      })
    )
    expect(result.links.self).toEqual('/items?page=2&limit=10')
    expect(result.links.first).toEqual('/items?page=0&limit=10')
    expect(result.links.previous).toEqual('/items?page=1&limit=10')
    expect(result.links.next).toEqual('/items?page=3&limit=10')
    expect(result.links.last).toEqual('/items?page=9&limit=10')
  })

  it('should paginate with default query', () => {
    const totalCount = 100
    const relativeUrl = '/items'
    const query = { page: 5, limit: 10 }
    const defaultQuery = { pricing: 'pro', filter: 'admin' }

    const result = paginate(totalCount, relativeUrl, query, defaultQuery)

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        page: 5,
        perPage: 10,
        pageCount: 10,
        totalCount: 100
      })
    )
    expect(result.links.self).toEqual(
      '/items?filter=admin&pricing=pro&page=5&limit=10'
    )
    expect(result.links.first).toEqual(
      '/items?filter=admin&pricing=pro&page=0&limit=10'
    )
    expect(result.links.previous).toEqual(
      '/items?filter=admin&pricing=pro&page=4&limit=10'
    )
    expect(result.links.next).toEqual(
      '/items?filter=admin&pricing=pro&page=6&limit=10'
    )
    expect(result.links.last).toEqual(
      '/items?filter=admin&pricing=pro&page=9&limit=10'
    )
  })

  it('should paginate correctly edge cases where pervious or next is null', () => {
    const totalCount = 10
    const relativeUrl = '/items'
    const query = { page: 0, limit: 10 }

    const result = paginate(totalCount, relativeUrl, query)

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        page: 0,
        perPage: 10,
        pageCount: 1,
        totalCount: 10
      })
    )
    expect(result.links.self).toEqual('/items?page=0&limit=10')
    expect(result.links.first).toEqual('/items?page=0&limit=10')
    expect(result.links.previous).toBeNull()
    expect(result.links.next).toBeNull()
    expect(result.links.last).toEqual('/items?page=0&limit=10')
  })

  it('should receive empty object when page is greater than maximum page limit', () => {
    const totalCount = 4
    const relativeUrl = '/items'
    const query = { page: 3, limit: 2 }

    const result = paginate(totalCount, relativeUrl, query)

    expect(result).toBeDefined()
    expect(result).toEqual({})
  })

  it('should receive empty object when limit is 0 or undefined', () => {
    const totalCount = 10
    const relativeUrl = '/items'
    const query = { page: 0, limit: 0 }
    const result = paginate(totalCount, relativeUrl, query)

    expect(result).toBeDefined()
    expect(result).toEqual({})
  })
})
