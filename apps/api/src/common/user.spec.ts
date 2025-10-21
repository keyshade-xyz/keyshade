import { AuthProvider } from '@prisma/client'
import {
  addAuthProvider,
  hasAuthProvider,
  getPrimaryAuthProvider,
  migrateAuthProvider
} from './user'

describe('User Auth Provider Helper Functions', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    authProvider: AuthProvider.EMAIL_OTP,
    isActive: true,
    isAdmin: false,
    isOnboardingFinished: false,
    joinedOn: new Date(),
    referralCode: 'ABC123',
    profilePictureUrl: null,
    referredById: null,
    timesRemindedForOnboarding: 0
  }

  describe('addAuthProvider', () => {
    it('should add new auth provider to empty array', () => {
      const user = { ...mockUser, authProviders: [] }
      const result = addAuthProvider(user, AuthProvider.GOOGLE)

      expect(result).toEqual([AuthProvider.GOOGLE])
    })

    it('should add new auth provider to existing array', () => {
      const user = { ...mockUser, authProviders: [AuthProvider.EMAIL_OTP] }
      const result = addAuthProvider(user, AuthProvider.GOOGLE)

      expect(result).toEqual([AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE])
    })

    it('should not duplicate existing auth provider', () => {
      const user = {
        ...mockUser,
        authProviders: [AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]
      }
      const result = addAuthProvider(user, AuthProvider.GOOGLE)

      expect(result).toEqual([AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE])
    })

    it('should handle missing authProviders field', () => {
      const user = { ...mockUser }
      delete (user as any).authProviders
      const result = addAuthProvider(user, AuthProvider.GOOGLE)

      expect(result).toEqual([AuthProvider.GOOGLE])
    })
  })

  describe('hasAuthProvider', () => {
    it('should return true for existing provider in authProviders', () => {
      const user = {
        ...mockUser,
        authProviders: [AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]
      }

      expect(hasAuthProvider(user, AuthProvider.GOOGLE)).toBe(true)
      expect(hasAuthProvider(user, AuthProvider.GITHUB)).toBe(false)
    })

    it('should fallback to legacy authProvider field', () => {
      const user = { ...mockUser, authProviders: [] }

      expect(hasAuthProvider(user, AuthProvider.EMAIL_OTP)).toBe(true)
      expect(hasAuthProvider(user, AuthProvider.GOOGLE)).toBe(false)
    })

    it('should handle missing authProviders field', () => {
      const user = { ...mockUser }
      delete (user as any).authProviders

      expect(hasAuthProvider(user, AuthProvider.EMAIL_OTP)).toBe(true)
    })
  })

  describe('getPrimaryAuthProvider', () => {
    it('should return first provider from authProviders array', () => {
      const user = {
        ...mockUser,
        authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP]
      }

      expect(getPrimaryAuthProvider(user)).toBe(AuthProvider.GOOGLE)
    })

    it('should fallback to legacy authProvider field', () => {
      const user = { ...mockUser, authProviders: [] }

      expect(getPrimaryAuthProvider(user)).toBe(AuthProvider.EMAIL_OTP)
    })

    it('should return null if no providers exist', () => {
      const user = { ...mockUser, authProvider: null, authProviders: [] }

      expect(getPrimaryAuthProvider(user)).toBeNull()
    })
  })

  describe('migrateAuthProvider', () => {
    it('should migrate legacy authProvider to authProviders array', () => {
      const user = { ...mockUser, authProviders: [] }
      const result = migrateAuthProvider(user)

      expect(result).toEqual([AuthProvider.EMAIL_OTP])
    })

    it('should not override existing authProviders', () => {
      const user = { ...mockUser, authProviders: [AuthProvider.GOOGLE] }
      const result = migrateAuthProvider(user)

      expect(result).toEqual([AuthProvider.GOOGLE])
    })

    it('should return empty array if no legacy provider exists', () => {
      const user = { ...mockUser, authProvider: null, authProviders: [] }
      const result = migrateAuthProvider(user)

      expect(result).toEqual([])
    })
  })
})
