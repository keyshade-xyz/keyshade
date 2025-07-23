import { BadRequestException } from '@nestjs/common'
import { ExportService } from './export.service'
import { ExportData, ExportFormat } from './export.types'

describe('Export Configuration Tests', () => {
  const exportService = new ExportService()

  describe('format()', () => {
    it('should throw BadRequestException for unsupported formats', () => {
      const emptyData = { secrets: [], variables: [] }
      const badFormat = 'UNKNOWN_FORMAT' as ExportFormat

      expect(() => exportService.format(emptyData, badFormat)).toThrow(
        BadRequestException
      )
      expect(() => exportService.format(emptyData, badFormat)).toThrow(
        'Unsupported format: UNKNOWN_FORMAT'
      )
    })

    it('should format empty data as the base64 of {}', () => {
      const empty = { secrets: [], variables: [] } satisfies ExportData

      const expected = Buffer.from(JSON.stringify({}, null, 2)).toString(
        'base64'
      )

      expect(exportService.format(empty, ExportFormat.JSON)).toBe(expected)
    })

    it('should correctly encode values with special characters', () => {
      const data = {
        secrets: [{ name: 'emoji', value: '🔒\n✓' }],
        variables: []
      } satisfies ExportData

      const b64 = exportService.format(data, ExportFormat.JSON)

      const result = JSON.parse(Buffer.from(b64, 'base64').toString())

      expect(result).toEqual({ emoji: '🔒\n✓' })
    })
  })

  describe('flattenObject()', () => {
    // allow access to private method flattenObject
    interface ExportServicePrivate {
      flattenObject(data: ExportData): Record<string, string>
    }
    const flattenService = exportService as unknown as ExportServicePrivate

    it('should return an empty object when there are no secrets or variables', () => {
      const data = { secrets: [], variables: [] } satisfies ExportData

      expect(flattenService.flattenObject(data)).toEqual({})
    })

    it('should flatten variables only', () => {
      const data = {
        secrets: [],
        variables: [{ name: 'x', value: 'v' }]
      } satisfies ExportData

      expect(flattenService.flattenObject(data)).toEqual({ x: 'v' })
    })

    it('should flatten secrets only', () => {
      const data = {
        secrets: [{ name: 's', value: 'secret' }],
        variables: []
      } satisfies ExportData

      expect(flattenService.flattenObject(data)).toEqual({ s: 'secret' })
    })

    // TODO: check this case. While there is a check on duplicate secret names and
    // variable names, there is no check on duplicate secret and variable names
    it('should let variables override secrets on duplicate names', () => {
      const data = {
        secrets: [{ name: 'dup', value: 'first' }],
        variables: [{ name: 'dup', value: 'second' }]
      } satisfies ExportData

      expect(flattenService.flattenObject(data)).toEqual({ dup: 'second' })
    })
  })

  describe('specific format export', () => {
    it('should format JSON data and return base64', () => {
      const data = {
        secrets: [
          { name: 'foo', value: 'secret1' },
          { name: 'bar', value: 'secret2' }
        ],
        variables: [{ name: 'baz', value: 'var1' }]
      } satisfies ExportData

      const flat = { foo: 'secret1', bar: 'secret2', baz: 'var1' }
      const json = JSON.stringify(flat, null, 2)
      const expectedB64 = Buffer.from(json).toString('base64')

      const result = exportService.format(data, ExportFormat.JSON)

      expect(result).toBe(expectedB64)
    })
  })
})
