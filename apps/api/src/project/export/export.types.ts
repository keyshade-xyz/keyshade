export enum ExportFormat {
  JSON = 'json'
}

export interface Secret {
  name: string
  value: string
}

export interface Variable {
  name: string
  value: string
}

export interface ExportData {
  secrets: Secret[]
  variables: Variable[]
}
