export { ExportFormat } from '@keyshade/common'

export interface Configuration {
  name: string
  value: string
}

export interface ExportData {
  secrets?: Configuration[]
  variables?: Configuration[]
}
