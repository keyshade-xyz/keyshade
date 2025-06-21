export { ExportFormat } from '@keyshade/common'

export interface Configuration {
  name: string
  value: string
}

export interface ExportData {
  secrets?: Configuration[]
  variables?: Configuration[]
}

export interface SecretManifest {
  apiVersion: 'v1'
  kind: 'Secret'
  metadata: { name: string }
  type: 'Opaque'
  data: Record<string, string>
}

export interface ConfigMapManifest {
  apiVersion: 'v1'
  kind: 'ConfigMap'
  metadata: { name: string }
  data: Record<string, string>
}
