import { DeviceDetail } from '@/auth/auth.types'

export interface CliSessionResponse {
  id: string
  createdAt: Date
  updatedAt: Date
  lastUsedOn: Date
  deviceDetail: Omit<DeviceDetail, 'encryptedIpAddress'>
}

export interface UserSessionResponse {
  id: string
  createdAt: Date
  updatedAt: Date
  lastUsedOn: Date
  deviceDetail: Omit<DeviceDetail, 'encryptedIpAddress'>
}
