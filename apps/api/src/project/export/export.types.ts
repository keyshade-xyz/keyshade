import { Configuration } from '@/socket/socket.types'

export enum ExportFormat {
  JSON = 'json'
}

export interface ExportData {
  secrets: Configuration[]
  variables: Configuration[]
}
