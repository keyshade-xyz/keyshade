export enum ExportFormat {
  JSON = 'json'
}

export interface ExportFormatInfo {
  label: string
  mimeType: string
  extension: string
}

/**
 * Definitions for every ExportFormat:
 *  • label:     human-readable
 *  • mimeType:  HTTP Content-Type
 *  • extension: file suffix
 */
export const EXPORT_FORMAT_INFO: Record<ExportFormat, ExportFormatInfo> = {
  [ExportFormat.JSON]: {
    label: 'JSON',
    mimeType: 'application/json',
    extension: 'json'
  }
}
