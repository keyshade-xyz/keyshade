export interface GetselfRequest {
  id?: string
}
export interface GetselfResponse {
  id: string
  email: string
  name?: string | null
  profilePictureUrl?: string | null
  isOnboardingFinished?: boolean
  isAdmin: boolean
}
export interface UpdateselfRequest {
  id?: string
}
export interface UpdateselfResponse {
  id: string
  email: string
  name?: string | null
  profilePictureUrl?: string | null
  isActive: boolean
  isOnboardingFinished?: boolean
  isAdmin: boolean
  authProvider: string
}
export interface DeleteselfRequest {
  id?: string
}
export interface DeleteselfResponse {
  null?: null
}
export interface GetUserRequest {
  id: string
}

export interface GetUserResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
}
