export enum ExportFormat {
  JSON = 'json'
}

/**
 * Metadata for each ExportFormat:
 *   - label: human-readable
 *   - mimeType: HTTP Content-Type
 *   - extension: file suffix
 */
export const ExportFormatMetadata: Record<
  ExportFormat,
  { label: string; mimeType: string; extension: string }
> = {
  [ExportFormat.JSON]: {
    label: 'JSON',
    mimeType: 'application/json',
    extension: 'json'
  }
}

export const ALL_EXPORT_FORMATS = Object.values(ExportFormat) as ExportFormat[]
