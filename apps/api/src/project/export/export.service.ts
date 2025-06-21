import { Injectable, BadRequestException } from '@nestjs/common'
import {
  ConfigMapManifest,
  ExportData,
  ExportFormat,
  SecretManifest
} from './export.types'
import { dump } from 'js-yaml'

type FormatterFn = (data: ExportData) => string

@Injectable()
export class ExportService {
  private readonly formatters: Record<ExportFormat, FormatterFn> = {
    [ExportFormat.JSON]: (data) => this.formatJson(data),
    [ExportFormat.KUBERNETES]: (data) => this.formatKubernetes(data)
  }

  format(data: ExportData, format: ExportFormat): string {
    const fn = this.formatters[format]
    if (!fn) {
      throw new BadRequestException(`Unsupported format: ${format}`)
    }
    return Buffer.from(fn(data)).toString('base64')
  }

  private flattenObject(data: ExportData): Record<string, string> {
    const entries = [
      ...(data.secrets?.map(({ name, value }) => [name, value]) ?? []),
      ...(data.variables?.map(({ name, value }) => [name, value]) ?? [])
    ]

    return Object.fromEntries(entries)
  }

  private formatJson(data: ExportData): string {
    return JSON.stringify(this.flattenObject(data), null, 2)
  }

  private formatKubernetes(data: ExportData): string {
    const { secrets = [], variables = [] } = data

    if (secrets.length === 0 && variables.length === 0) return ''

    if (secrets.length) {
      const merged = [...secrets, ...variables]
      const doc: SecretManifest = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: 'my-secrets' },
        type: 'Opaque',
        data: Object.fromEntries(
          merged.map(({ name, value }) => [
            name,
            Buffer.from(value).toString('base64')
          ])
        )
      }
      return dump(doc)
    }

    const doc: ConfigMapManifest = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'my-config' },
      data: Object.fromEntries(
        variables.map(({ name, value }) => [name, value])
      )
    }

    return dump(doc)
  }
}
