import {
  excludeFields,
  limitMaxItemsPerPage,
  addHoursToDate,
  constructErrorBody,
  makeTimedRequest,
  retryWithBackoff,
  mapEntriesToEventMetadata
} from './util'

describe('Util Tests', () => {
  describe('excludeFields', () => {
    it('should exclude fields', () => {
      const object = {
        id: '1',
        name: 'John Doe',
        email: 'johndoe@keyshade.io',
        profilePictureUrl: 'https://keyshade.io/johndoe.jpg',
        isActive: true,
        isOnboardingFinished: false,
        isAdmin: false
      }

      const excluded = excludeFields(object, 'isActive')
      expect(excluded).not.toHaveProperty('isActive')
      expect(excluded).toEqual({
        ...object,
        isActive: undefined
      })
    })

    it('should exclude multiple fields', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      const result = excludeFields(obj, 'b', 'd')
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should return a copy when no fields specified', () => {
      const obj = { a: 1, b: 2 }
      const result = excludeFields(obj)
      expect(result).toEqual({ a: 1, b: 2 })
    })
  })

  describe('limitMaxItemsPerPage', () => {
    it('should return the limit when less than maxLimit', () => {
      expect(limitMaxItemsPerPage(10)).toBe(10)
    })

    it('should return the maxLimit when limit exceeds it', () => {
      expect(limitMaxItemsPerPage(50)).toBe(30)
    })

    it('should return the limit when equal to maxLimit', () => {
      expect(limitMaxItemsPerPage(30)).toBe(30)
    })

    it('should use custom maxLimit', () => {
      expect(limitMaxItemsPerPage(100, 50)).toBe(50)
      expect(limitMaxItemsPerPage(25, 50)).toBe(25)
    })

    it('should handle zero limit', () => {
      expect(limitMaxItemsPerPage(0)).toBe(0)
    })
  })

  describe('addHoursToDate', () => {
    it('should return null when hours is undefined', () => {
      expect(addHoursToDate()).toBeNull()
    })

    it('should return null when hours is "never"', () => {
      expect(addHoursToDate('never')).toBeNull()
    })

    it('should return null when hours is 0', () => {
      expect(addHoursToDate(0)).toBeNull()
    })

    it('should return a future date for positive hours', () => {
      const before = new Date()
      const result = addHoursToDate(2)
      expect(result).toBeInstanceOf(Date)
      expect(result!.getTime()).toBeGreaterThan(before.getTime())
    })

    it('should accept string hours', () => {
      const result = addHoursToDate('5')
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('constructErrorBody', () => {
    it('should return JSON with header and body', () => {
      const result = constructErrorBody('Error', 'Something went wrong')
      const parsed = JSON.parse(result)
      expect(parsed).toEqual({
        header: 'Error',
        body: 'Something went wrong'
      })
    })

    it('should handle empty strings', () => {
      const result = constructErrorBody('', '')
      const parsed = JSON.parse(result)
      expect(parsed).toEqual({ header: '', body: '' })
    })

    it('should handle special characters', () => {
      const result = constructErrorBody('Error "test"', 'Line1\nLine2')
      const parsed = JSON.parse(result)
      expect(parsed.header).toBe('Error "test"')
      expect(parsed.body).toBe('Line1\nLine2')
    })
  })

  describe('makeTimedRequest', () => {
    it('should return the response and duration', async () => {
      const result = await makeTimedRequest(async () => 'hello')
      expect(result.response).toBe('hello')
      expect(typeof result.duration).toBe('number')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('should propagate errors', async () => {
      await expect(
        makeTimedRequest(async () => {
          throw new Error('fail')
        })
      ).rejects.toThrow('fail')
    })
  })

  describe('retryWithBackoff', () => {
    it('should return on first success', async () => {
      const fn = jest.fn().mockResolvedValue('ok')
      const result = await retryWithBackoff(fn, 3, 10)
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure then succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValue('ok')
      const result = await retryWithBackoff(fn, 3, 10)
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fail'))
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('always fail')
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('mapEntriesToEventMetadata', () => {
    it('should map entries to environment-keyed object', () => {
      const entries = [
        { environmentSlug: 'prod', value: 'secret1' },
        { environmentSlug: 'staging', value: 'secret2' }
      ] as any[]
      const result = mapEntriesToEventMetadata(entries)
      expect(result).toEqual({
        prod: 'secret1',
        staging: 'secret2'
      })
    })

    it('should return empty object for undefined entries', () => {
      expect(mapEntriesToEventMetadata(undefined)).toEqual({})
    })

    it('should return empty object for empty array', () => {
      expect(mapEntriesToEventMetadata([])).toEqual({})
    })
  })
})
