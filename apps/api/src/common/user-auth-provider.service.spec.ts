import { Test, TestingModule } from '@nestjs/testing'
import { UserAuthProviderService } from './user-auth-provider.service'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthProvider } from '@prisma/client'

describe('UserAuthProviderService', () => {
  let service: UserAuthProviderService
  let prisma: PrismaService

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    authProvider: AuthProvider.EMAIL_OTP,
    authProviders: [AuthProvider.EMAIL_OTP],
    isActive: true,
    isAdmin: false,
    isOnboardingFinished: false,
    joinedOn: new Date(),
    referralCode: 'ABC123',
    profilePictureUrl: null,
    referredById: null,
    timesRemindedForOnboarding: 0
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthProviderService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
            user: {
              findUnique: jest.fn()
            }
          }
        }
      ]
    }).compile()

    service = module.get<UserAuthProviderService>(UserAuthProviderService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('hasAuthProvider', () => {
    it('should return true if user has the auth provider in authProviders array', () => {
      const user = {
        ...mockUser,
        authProviders: [AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]
      }

      expect(service.hasAuthProvider(user, AuthProvider.GOOGLE)).toBe(true)
      expect(service.hasAuthProvider(user, AuthProvider.GITHUB)).toBe(false)
    })

    it('should fallback to legacy authProvider field if authProviders is empty', () => {
      const user = {
        ...mockUser,
        authProvider: AuthProvider.GITHUB,
        authProviders: []
      }

      expect(service.hasAuthProvider(user, AuthProvider.GITHUB)).toBe(true)
      expect(service.hasAuthProvider(user, AuthProvider.GOOGLE)).toBe(false)
    })

    it('should handle missing authProviders field gracefully', () => {
      const user = {
        ...mockUser,
        authProvider: AuthProvider.GOOGLE
      }
      delete (user as any).authProviders

      expect(service.hasAuthProvider(user, AuthProvider.GOOGLE)).toBe(true)
    })
  })

  describe('getAuthProviders', () => {
    it('should return authProviders array if present', () => {
      const user = {
        ...mockUser,
        authProviders: [AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]
      }

      const providers = service.getAuthProviders(user)
      expect(providers).toEqual([AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE])
    })

    it('should fallback to legacy authProvider if authProviders is empty', () => {
      const user = {
        ...mockUser,
        authProvider: AuthProvider.GITHUB,
        authProviders: []
      }

      const providers = service.getAuthProviders(user)
      expect(providers).toEqual([AuthProvider.GITHUB])
    })

    it('should return empty array if no auth providers exist', () => {
      const user = {
        ...mockUser,
        authProvider: null,
        authProviders: []
      }

      const providers = service.getAuthProviders(user)
      expect(providers).toEqual([])
    })
  })

  describe('getPrimaryAuthProvider', () => {
    it('should return first provider from authProviders array', () => {
      const user = {
        ...mockUser,
        authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP]
      }

      const primary = service.getPrimaryAuthProvider(user)
      expect(primary).toBe(AuthProvider.GOOGLE)
    })

    it('should fallback to legacy authProvider if authProviders is empty', () => {
      const user = {
        ...mockUser,
        authProvider: AuthProvider.GITHUB,
        authProviders: []
      }

      const primary = service.getPrimaryAuthProvider(user)
      expect(primary).toBe(AuthProvider.GITHUB)
    })

    it('should return null if no auth providers exist', () => {
      const user = {
        ...mockUser,
        authProvider: null,
        authProviders: []
      }

      const primary = service.getPrimaryAuthProvider(user)
      expect(primary).toBeNull()
    })
  })

  describe('addAuthProvider', () => {
    it('should add new auth provider to user', async () => {
      const userQueryResult = [mockUser]
      const updatedUserResult = [
        {
          ...mockUser,
          authProviders: [AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]
        }
      ]

      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(userQueryResult)
      jest.spyOn(prisma, '$executeRaw').mockResolvedValueOnce(undefined)
      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(updatedUserResult)

      const result = await service.addAuthProvider(
        'user-1',
        AuthProvider.GOOGLE
      )

      expect((result as any).authProviders).toContain(AuthProvider.GOOGLE)
      expect(prisma.$executeRaw).toHaveBeenCalledWith(
        expect.anything(), // The template literal creates a more complex structure
        expect.arrayContaining([AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]),
        'user-1'
      )
    })

    it('should not duplicate existing auth provider', async () => {
      const userWithGoogle = {
        ...mockUser,
        authProviders: [AuthProvider.EMAIL_OTP, AuthProvider.GOOGLE]
      }
      const userQueryResult = [userWithGoogle]

      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(userQueryResult)

      const result = await service.addAuthProvider(
        'user-1',
        AuthProvider.GOOGLE
      )

      expect(result).toEqual(userWithGoogle)
      expect(prisma.$executeRaw).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const userQueryResult = [mockUser]

      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(userQueryResult)
      jest
        .spyOn(prisma, '$executeRaw')
        .mockRejectedValueOnce(new Error('Database error'))

      const result = await service.addAuthProvider(
        'user-1',
        AuthProvider.GOOGLE
      )

      // Should return original user if update fails
      expect(result).toEqual(mockUser)
    })

    it('should throw error if user not found', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([])

      await expect(
        service.addAuthProvider('nonexistent', AuthProvider.GOOGLE)
      ).rejects.toThrow('User with ID nonexistent not found')
    })
  })

  describe('migrateUserAuthProvider', () => {
    it('should migrate legacy authProvider to authProviders array', async () => {
      const userWithLegacyAuth = {
        ...mockUser,
        authProvider: AuthProvider.GITHUB,
        authProviders: []
      }
      const userQueryResult = [userWithLegacyAuth]
      const updatedUserResult = [
        {
          ...userWithLegacyAuth,
          authProviders: [AuthProvider.GITHUB]
        }
      ]

      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(userQueryResult)
      jest.spyOn(prisma, '$executeRaw').mockResolvedValueOnce(undefined)
      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(updatedUserResult)

      const result = await service.migrateUserAuthProvider('user-1')

      expect((result as any).authProviders).toEqual([AuthProvider.GITHUB])
    })

    it('should not migrate if authProviders already has values', async () => {
      const userWithAuthProviders = {
        ...mockUser,
        authProvider: AuthProvider.GITHUB,
        authProviders: [AuthProvider.EMAIL_OTP]
      }
      const userQueryResult = [userWithAuthProviders]

      jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce(userQueryResult)

      const result = await service.migrateUserAuthProvider('user-1')

      expect(result).toEqual(userWithAuthProviders)
      expect(prisma.$executeRaw).not.toHaveBeenCalled()
    })
  })
})
