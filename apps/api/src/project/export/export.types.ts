export enum ExportFormat {
  JSON = 'json'
}

export interface Configuration {
  name: string
  value: string
}

export interface ExportData {
  secrets: Configuration[]
  variables: Configuration[]
}
