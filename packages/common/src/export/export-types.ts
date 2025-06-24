export enum ExportFormat {
  JSON = 'JSON',
  KUBERNETES = 'KUBERNETES'
}

export interface ExportFormatInfo {
  label: string
  mimeType: string
  extension: string
}

export const EXPORT_FORMAT_INFO: Record<ExportFormat, ExportFormatInfo> = {
  [ExportFormat.JSON]: {
    label: 'JSON',
    mimeType: 'application/json',
    extension: 'json'
  },
  [ExportFormat.KUBERNETES]: {
    label: 'KUBERNETES',
    mimeType: 'application/x-yaml',
    extension: 'yaml'
  }
}

interface Configuration {
  name: string
  value: string
}

export interface ExportData {
  secrets?: Configuration[]
  variables?: Configuration[]
}
