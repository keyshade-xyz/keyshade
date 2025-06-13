import type { ProfileConfig } from '@/types/index.types'

export const checkProfileExists = (
  profiles: ProfileConfig,
  profile: string,
  s?: any
): void => {
  if (!profiles[profile]) {
    if (s) {
      s.stop(`Profile ${profile} not found`)
    } else throw new Error(`Profile ${profile} not found`)
  }
}

export const checkIsDefaultProfile = (
  profiles: ProfileConfig,
  profile: string
): boolean => {
  return profiles.default === profile
}

export const getDefaultProfile = (profiles: ProfileConfig): string => {
  return profiles.default
}
