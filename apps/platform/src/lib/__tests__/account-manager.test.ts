/**
 * Tests for Account Manager
 * These tests demonstrate the functionality of the multi-account system
 */

import { AccountManager, type AccountProfile } from '../account-manager'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('AccountManager', () => {
  let accountManager: AccountManager

  beforeEach(() => {
    localStorageMock.clear()
    accountManager = AccountManager.getInstance()
  })

  describe('addProfile', () => {
    it('should add a new profile', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        profilePictureUrl: 'https://example.com/avatar.jpg'
      }

      const profile = accountManager.addProfile(user)

      expect(profile).toBeDefined()
      expect(profile.id).toBe(user.id)
      expect(profile.email).toBe(user.email)
      expect(profile.name).toBe(user.name)
    })

    it('should throw error when user.id is missing', () => {
      const user = {
        email: 'user1@example.com',
        name: 'User One'
      }

      expect(() => {
        accountManager.addProfile(user)
      }).toThrow('User ID and email are required to create a profile.')
    })

    it('should throw error when user.email is missing', () => {
      const user = {
        id: 'user-1',
        name: 'User One'
      }
      const token = 'jwt-token-123'

      expect(() => {
        accountManager.addProfile(user)
      }).toThrow('User ID and email are required to create a profile.')
    })

    it('should throw error when both id and email are missing', () => {
      const user = {
        name: 'User One'
      }
      const token = 'jwt-token-123'

      expect(() => {
        accountManager.addProfile(user)
      }).toThrow('User ID and email are required to create a profile.')
    })

    it('should set first profile as active', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const token = 'jwt-token-123'

      accountManager.addProfile(user)
      const activeProfile = accountManager.getActiveProfile()

      expect(activeProfile).toBeDefined()
      expect(activeProfile?.id).toBe(user.id)
    })

    it('should add multiple profiles', () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }

      accountManager.addProfile(user1)
      accountManager.addProfile(user2)

      const profiles = accountManager.getAllProfiles()
      expect(profiles).toHaveLength(2)
    })
  })

  describe('getActiveProfile', () => {
    it('should return null when no profiles exist', () => {
      const activeProfile = accountManager.getActiveProfile()
      expect(activeProfile).toBeNull()
    })

    it('should return active profile', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const activeProfile = accountManager.getActiveProfile()

      expect(activeProfile).toBeDefined()
      expect(activeProfile?.id).toBe(user.id)
    })
  })

  describe('getAllProfiles', () => {
    it('should return empty array when no profiles exist', () => {
      const profiles = accountManager.getAllProfiles()
      expect(profiles).toEqual([])
    })

    it('should return all profiles sorted by last used', () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }

      accountManager.addProfile(user1)
      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        accountManager.addProfile(user2)
      }, 10)

      const profiles = accountManager.getAllProfiles()
      expect(profiles).toHaveLength(2)
      // Most recently used should be first
      expect(profiles[0].id).toBe(user2.id)
    })
  })

  describe('switchProfile', () => {
    it('should switch to different profile', () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }

      accountManager.addProfile(user1)
      accountManager.addProfile(user2)

      const switched = accountManager.switchProfile('user-2')
      expect(switched).toBeDefined()
      expect(switched?.id).toBe('user-2')

      const activeProfile = accountManager.getActiveProfile()
      expect(activeProfile?.id).toBe('user-2')
    })

    it('should return null for non-existent profile', () => {
      const switched = accountManager.switchProfile('non-existent')
      expect(switched).toBeNull()
    })

    it('should update last used timestamp', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const profile1 = accountManager.getProfile('user-1')
      const lastUsed1 = profile1?.lastUsed

      setTimeout(() => {
        accountManager.switchProfile('user-1')
        const profile2 = accountManager.getProfile('user-1')
        const lastUsed2 = profile2?.lastUsed

        expect(new Date(lastUsed2!).getTime()).toBeGreaterThan(
          new Date(lastUsed1!).getTime()
        )
      }, 10)
    })
  })

  describe('removeProfile', () => {
    it('should remove profile', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const removed = accountManager.removeProfile('user-1')

      expect(removed).toBe(true)
      expect(accountManager.getProfile('user-1')).toBeNull()
    })

    it('should return false for non-existent profile', () => {
      const removed = accountManager.removeProfile('non-existent')
      expect(removed).toBe(false)
    })

    it('should switch to another profile when removing active', () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }

      accountManager.addProfile(user1)
      accountManager.addProfile(user2)

      // user-1 is active by default
      accountManager.removeProfile('user-1')

      const activeProfile = accountManager.getActiveProfile()
      expect(activeProfile?.id).toBe('user-2')
    })
  })

  describe('getProfile', () => {
    it('should return profile by id', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const profile = accountManager.getProfile('user-1')

      expect(profile).toBeDefined()
      expect(profile?.id).toBe(user.id)
    })

    it('should return null for non-existent profile', () => {
      const profile = accountManager.getProfile('non-existent')
      expect(profile).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile data', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const updated = accountManager.updateProfile('user-1', {
        name: 'Updated Name',
        profilePictureUrl: 'https://example.com/new-avatar.jpg'
      })

      expect(updated).toBeDefined()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.profilePictureUrl).toBe(
        'https://example.com/new-avatar.jpg'
      )
    })

    it('should not allow updating id', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const updated = accountManager.updateProfile('user-1', {
        id: 'new-id'
      } as any)

      expect(updated?.id).toBe('user-1') // Should keep original id
    })

    it('should return null for non-existent profile', () => {
      const updated = accountManager.updateProfile('non-existent', {
        name: 'New Name'
      })
      expect(updated).toBeNull()
    })
  })

  describe('hasProfileByEmail', () => {
    it('should return true if profile exists', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      expect(accountManager.hasProfileByEmail('user1@example.com')).toBe(true)
    })

    it('should return false if profile does not exist', () => {
      expect(accountManager.hasProfileByEmail('nonexistent@example.com')).toBe(
        false
      )
    })
  })

  describe('getProfileByEmail', () => {
    it('should return profile by email', () => {
      const user = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }

      accountManager.addProfile(user)
      const profile = accountManager.getProfileByEmail('user1@example.com')

      expect(profile).toBeDefined()
      expect(profile?.email).toBe(user.email)
    })

    it('should return null for non-existent email', () => {
      const profile = accountManager.getProfileByEmail('nonexistent@example.com')
      expect(profile).toBeNull()
    })
  })

  describe('clearAllProfiles', () => {
    it('should clear all profiles', () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }

      accountManager.addProfile(user1)
      accountManager.addProfile(user2)

      accountManager.clearAllProfiles()

      expect(accountManager.getAllProfiles()).toEqual([])
      expect(accountManager.getActiveProfile()).toBeNull()
    })
  })

  describe('getProfileCount', () => {
    it('should return 0 when no profiles exist', () => {
      expect(accountManager.getProfileCount()).toBe(0)
    })

    it('should return correct count', () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One'
      }
      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two'
      }

      accountManager.addProfile(user1)
      expect(accountManager.getProfileCount()).toBe(1)

      accountManager.addProfile(user2)
      expect(accountManager.getProfileCount()).toBe(2)
    })
  })
})
