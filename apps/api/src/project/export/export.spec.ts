import { BadRequestException } from '@nestjs/common'
import { ExportService } from './export.service'
import { ExportData, ExportFormat } from './export.types'
import { load } from 'js-yaml'

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

    it('should let variables override secrets on duplicate names', () => {
      const data = {
        secrets: [{ name: 'dup', value: 'first' }],
        variables: [{ name: 'dup', value: 'second' }]
      } satisfies ExportData

      expect(flattenService.flattenObject(data)).toEqual({ dup: 'second' })
    })
  })

  describe('specific format export', () => {
    describe('JSON formatter', () => {
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

    describe('Kubernetes formatter', () => {
      const decode = (b64: string) => Buffer.from(b64, 'base64').toString()

      it('should return empty string for empty data', () => {
        const empty: ExportData = { secrets: [], variables: [] }

        expect(exportService.format(empty, ExportFormat.KUBERNETES)).toBe('')
      })

      it('should create a ConfigMap when only variables exist', () => {
        const data: ExportData = {
          secrets: [],
          variables: [
            { name: 'VAR1', value: 'value1' },
            { name: 'VAR2', value: 'value2' }
          ]
        }

        const yamlResponse = decode(
          exportService.format(data, ExportFormat.KUBERNETES)
        )

        const doc = load(yamlResponse)

        expect(doc).toMatchObject({
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: { name: 'my-config' },
          data: { VAR1: 'value1', VAR2: 'value2' }
        })
      })

      it('should create a Secret when only secrets exist', () => {
        const data: ExportData = {
          secrets: [{ name: 'PASSWORD', value: 'p@$$w0rd' }],
          variables: []
        }

        const yamlResponse = decode(
          exportService.format(data, ExportFormat.KUBERNETES)
        )

        const doc = load(yamlResponse) as any

        expect(doc).toMatchObject({
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: { name: 'my-secrets' },
          type: 'Opaque'
        })

        expect(doc.data.PASSWORD).toBe(
          Buffer.from('p@$$w0rd').toString('base64')
        )
      })

      it('should merge secrets and variables into a Secret', () => {
        const data: ExportData = {
          secrets: [{ name: 'SECRET_KEY', value: 'secretVal' }],
          variables: [{ name: 'VAR_KEY', value: 'varVal' }]
        }
        const yamlResponse = decode(
          exportService.format(data, ExportFormat.KUBERNETES)
        )
        const doc = load(yamlResponse) as any

        expect(doc.kind).toBe('Secret')
        expect(doc.data.SECRET_KEY).toBe(
          Buffer.from('secretVal').toString('base64')
        )
        expect(doc.data.VAR_KEY).toBe(Buffer.from('varVal').toString('base64'))
      })
    })
  })
})
