import { dump } from 'js-yaml'
import { ExportData, ExportFormat } from './export-types'

const flattenObject = (data: ExportData): Record<string, string> =>
  [
    ...(data.secrets ?? []).map(({ name, value }) => [name, value]),
    ...(data.variables ?? []).map(({ name, value }) => [name, value])
  ].reduce<Record<string, string>>(
    (acc, [key, val]) => ({ ...acc, [key]: val }),
    {}
  )

const formatJson = (data: ExportData): string =>
  JSON.stringify(flattenObject(data), null, 2)

const formatKubernetes = (data: ExportData): string => {
  const { secrets = [], variables = [] } = data

  if (!secrets.length && !variables.length) return ''

  return secrets.length
    ? dump({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: 'my-secrets' },
        type: 'Opaque',
        data: [...secrets, ...variables].reduce<Record<string, string>>(
          (acc, { name, value }) => ({
            ...acc,
            [name]: Buffer.from(value).toString('base64')
          }),
          {}
        )
      })
    : dump({
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: 'my-config' },
        data: variables.reduce<Record<string, string>>(
          (acc, { name, value }) => ({ ...acc, [name]: value }),
          {}
        )
      })
}

const formatters: Record<ExportFormat, (data: ExportData) => string> = {
  [ExportFormat.JSON]: formatJson,
  [ExportFormat.KUBERNETES]: formatKubernetes
}

export const formatExport = (
  data: ExportData,
  format: ExportFormat
): string => {
  const fn = formatters[format]
  if (!fn) throw new Error(`Unsupported format: ${format}`)
  return fn(data)
}
