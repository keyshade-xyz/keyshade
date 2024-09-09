import { type ProjectRootConfig } from '../index.types'

export interface Configuration {
  name: string
  value: string
  isPlaintext: boolean
}

export interface ClientRegisteredResponse {
  success: boolean
  message: string
}

export interface RunData extends ProjectRootConfig {
  privateKey: string
}
