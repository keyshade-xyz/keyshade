import { z } from 'zod'
import {
  PageRequestSchema,
  PageResponseSchema,
  ResponseErrorSchema,
  ClientResponseSchema
} from '@/pagination'

describe('Pagination Schema Tests', () => {
  // Tests for PageRequestSchema
  it('should validate a valid PageRequestSchema', () => {
    const result = PageRequestSchema.safeParse({
      page: 1,
      limit: 10
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid PageRequestSchema with incorrect types', () => {
    const result = PageRequestSchema.safeParse({
      page: 'one' // should be a number
    })

    expect(result.success).toBe(false)
  })

  // Tests for PageResponseSchema
  const itemSchema = z.object({
    id: z.string(),
    name: z.string()
  })

  it('should validate a valid PageResponseSchema', () => {
    const result = PageResponseSchema(itemSchema).safeParse({
      items: [{ id: '123', name: 'Test' }],
      metadata: {
        page: 1,
        perPage: 10,
        pageCount: 1,
        totalCount: 1,
        links: {
          self: 'http://example.com/page/1',
          first: 'http://example.com/page/1',
          previous: null,
          next: null,
          last: 'http://example.com/page/1'
        }
      }
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid PageResponseSchema with incorrect items type', () => {
    const result = PageResponseSchema(itemSchema).safeParse({
      items: 'not-an-array', // should be an array
      metadata: {
        page: 1,
        perPage: 10,
        pageCount: 1,
        totalCount: 1,
        links: {
          self: 'http://example.com/page/1',
          first: 'http://example.com/page/1',
          previous: null,
          next: null,
          last: 'http://example.com/page/1'
        }
      }
    })

    expect(result.success).toBe(false)
  })

  it('should not validate an invalid PageResponseSchema with missing metadata fields', () => {
    const result = PageResponseSchema(itemSchema).safeParse({
      items: [{ id: '123', name: 'Test' }],
      metadata: {
        page: 1,
        perPage: 10,
        pageCount: 1,
        // totalCount is missing
        links: {
          self: 'http://example.com/page/1',
          first: 'http://example.com/page/1',
          previous: null,
          next: null,
          last: 'http://example.com/page/1'
        }
      }
    })

    expect(result.success).toBe(false)
  })

  // Tests for ResponseErrorSchema
  it('should validate a valid ResponseErrorSchema', () => {
    const result = ResponseErrorSchema.safeParse({
      message: 'An error occurred',
      error: 'ERROR_CODE',
      statusCode: 400
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid ResponseErrorSchema with missing fields', () => {
    const result = ResponseErrorSchema.safeParse({
      message: 'An error occurred',
      error: 'ERROR_CODE'
    })

    expect(result.success).toBe(false)
  })

  // Tests for ClientResponseSchema
  const dataSchema = z.object({
    id: z.string(),
    name: z.string()
  })

  it('should validate when success is true and data is present', () => {
    const result = ClientResponseSchema(dataSchema).safeParse({
      success: true,
      error: null,
      data: { id: '123', name: 'Test' }
    })

    expect(result.success).toBe(true)
  })

  it('should validate when success is false and error is present', () => {
    const result = ClientResponseSchema(dataSchema).safeParse({
      success: false,
      error: {
        message: 'An error occurred',
        error: 'ERROR_CODE',
        statusCode: 400
      },
      data: null
    })

    expect(result.success).toBe(true)
  })

  it('should not validate when success is true and data is null', () => {
    const result = ClientResponseSchema(dataSchema).safeParse({
      success: true,
      error: null,
      data: null
    })

    expect(result.success).toBe(false)
  })

  it('should not validate when success is false and error is null', () => {
    const result = ClientResponseSchema(dataSchema).safeParse({
      success: false,
      error: null,
      data: null
    })

    expect(result.success).toBe(false)
  })

  it('should not validate when success is true and error is present', () => {
    const result = ClientResponseSchema(dataSchema).safeParse({
      success: true,
      error: {
        message: 'An error occurred',
        error: 'ERROR_CODE',
        statusCode: 400
      },
      data: { id: '123', name: 'Test' }
    })

    expect(result.success).toBe(false)
  })

  it('should not validate when success is false and data is present', () => {
    const result = ClientResponseSchema(dataSchema).safeParse({
      success: false,
      error: {
        message: 'An error occurred',
        error: 'ERROR_CODE',
        statusCode: 400
      },
      data: { id: '123', name: 'Test' }
    })

    expect(result.success).toBe(false)
  })
})
