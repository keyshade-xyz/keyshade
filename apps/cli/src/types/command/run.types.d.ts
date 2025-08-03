import { type ProjectRootConfig } from '../index.types'

export interface Configuration {
  name: string
  value: string
  isPlaintext: boolean
}

export interface ClientRegisteredResponse {
  success: boolean
  message: string | object // Allow both string and object types since server can send either
}

export interface RunData extends ProjectRootConfig {
  privateKey: string
}
