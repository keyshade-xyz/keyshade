import { DeviceDetail } from '@/auth/auth.types'

export interface CliSessionResponse {
  id: string
  createdAt: Date
  updatedAt: Date
  lastUsedOn: Date | null
  deviceDetail: Omit<DeviceDetail, 'encryptedIpAddress'>
}

export interface BrowserSessionResponse {
  id: string
  createdAt: Date
  updatedAt: Date
  lastUsedOn: Date | null
  deviceDetail: Omit<DeviceDetail, 'encryptedIpAddress'>
}
