import { Injectable, BadRequestException } from '@nestjs/common'
import { ExportData, ExportFormat } from './export.types'

type FormatterFn = (data: ExportData) => string

@Injectable()
export class ExportService {
  private readonly formatters: Record<ExportFormat, FormatterFn> = {
    [ExportFormat.JSON]: (data) => this.formatJson(data)
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
}
