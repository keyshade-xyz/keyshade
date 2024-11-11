import { Workspace } from '@keyshade/schema'

export interface GetSelfResponse {
  id: string
  email: string
  name: string
  profilePictureUrl: string | null
  isActive: boolean
  isOnboardingFinished: boolean
  isAdmin: boolean
  authProvider: string
  defaultWorkspace: Workspace
}
export interface UpdateSelfRequest {
  name?: string
  profilePictureUrl?: string
  isOnboardingFinished?: boolean
  email?: string
}
export interface UpdateSelfResponse
  extends Partial<Omit<GetSelfResponse, 'defaultWorkspace'>> {}

export interface DeleteSelfRequest {}
export interface DeleteSelfResponse {}

export interface ValidateEmailChangeOTPRequest {
  otp: string
}
export interface ValidateEmailChangeOTPResponse
  extends Partial<Omit<GetSelfResponse, 'defaultWorkspace'>> {}

export interface ResendEmailChangeOTPRequest {}
export interface ResendEmailChangeOTPResponse {}
