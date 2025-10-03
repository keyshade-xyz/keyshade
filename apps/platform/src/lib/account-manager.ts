/**
 * Account Manager - Handles multiple account profiles in the browser
 * Stores encrypted account data in localStorage with secure token management
 */

import type { User } from '@keyshade/schema'
import Cookies from 'js-cookie'

export interface AccountProfile {
  id: string
  email: string
  name: string | null
  profilePictureUrl: string | null
  token: string
  isActive: boolean
  lastUsed: Date
  workspaceId?: string
}

export interface AccountStorage {
  profiles: Record<string, AccountProfile>
  activeProfileId: string | null
  version: string
}

const STORAGE_KEY = 'keyshade_accounts'
const STORAGE_VERSION = '1.0.0'

/**
 * Account Manager class for handling multiple user profiles
 */
export class AccountManager {
  private static instance: AccountManager

  private constructor() {}

  static getInstance(): AccountManager {
    if (!AccountManager.instance) {
      AccountManager.instance = new AccountManager()
    }
    return AccountManager.instance
  }

  /**
   * Initialize account storage if it doesn't exist
   */
  private initializeStorage(): AccountStorage {
    const storage: AccountStorage = {
      profiles: {},
      activeProfileId: null,
      version: STORAGE_VERSION
    }
    this.saveStorage(storage)
    return storage
  }

  /**
   * Get account storage from localStorage
   */
  private getStorage(): AccountStorage {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return this.initializeStorage()
      }
      const storage = JSON.parse(data) as AccountStorage
      
      // Validate version
      if (storage.version !== STORAGE_VERSION) {
        console.warn('Account storage version mismatch, reinitializing')
        return this.initializeStorage()
      }
      
      return storage
    } catch (error) {
      console.error('Error loading account storage:', error)
      return this.initializeStorage()
    }
  }

  /**
   * Save account storage to localStorage
   */
  private saveStorage(storage: AccountStorage): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    } catch (error) {
      console.error('Error saving account storage:', error)
    }
  }

  /**
   * Add or update a profile
   */
  addProfile(user: Partial<User>, token: string): AccountProfile {
    // Validate required fields
    if (!user.id || !user.email) {
      throw new Error('User ID and email are required to create a profile.')
    }

    const storage = this.getStorage()
    
    const profile: AccountProfile = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      profilePictureUrl: user.profilePictureUrl || null,
      token,
      isActive: true,
      lastUsed: new Date(),
      workspaceId: user.defaultWorkspace?.id
    }

    storage.profiles[profile.id] = profile
    
    // Set as active if no active profile exists
    if (!storage.activeProfileId) {
      storage.activeProfileId = profile.id
    }

    this.saveStorage(storage)
    return profile
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): AccountProfile[] {
    const storage = this.getStorage()
    return Object.values(storage.profiles).sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    )
  }

  /**
   * Get active profile
   */
  getActiveProfile(): AccountProfile | null {
    const storage = this.getStorage()
    if (!storage.activeProfileId) {
      return null
    }
    return storage.profiles[storage.activeProfileId] || null
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): AccountProfile | null {
    const storage = this.getStorage()
    return storage.profiles[id] || null
  }

  /**
   * Switch to a different profile
   */
  switchProfile(id: string): AccountProfile | null {
    const storage = this.getStorage()
    const profile = storage.profiles[id]
    
    if (!profile) {
      console.error('Profile not found:', id)
      return null
    }

    // Update active profile
    storage.activeProfileId = id
    profile.lastUsed = new Date()
    
    this.saveStorage(storage)

    // Set the token in cookies
    Cookies.set('token', profile.token, {
      expires: 7, // 7 days
      sameSite: 'lax',
      secure: window.location.protocol === 'https:'
    })

    return profile
  }

  /**
   * Remove a profile
   */
  removeProfile(id: string): boolean {
    const storage = this.getStorage()
    
    if (!storage.profiles[id]) {
      return false
    }

    delete storage.profiles[id]

    // If this was the active profile, switch to another one
    if (storage.activeProfileId === id) {
      // Switch to the most recently used profile for predictable behavior
      const remainingProfiles = Object.values(storage.profiles).sort(
        (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      )
      storage.activeProfileId = remainingProfiles.length > 0 ? remainingProfiles[0].id : null
      
      // Update cookies if switching to another profile
      if (storage.activeProfileId) {
        const newActiveProfile = storage.profiles[storage.activeProfileId]
        Cookies.set('token', newActiveProfile.token, {
          expires: 7,
          sameSite: 'lax',
          secure: window.location.protocol === 'https:'
        })
      } else {
        // No profiles left, clear the token
        Cookies.remove('token')
      }
    }

    this.saveStorage(storage)
    return true
  }

  /**
   * Update profile data
   */
  updateProfile(id: string, updates: Partial<AccountProfile>): AccountProfile | null {
    const storage = this.getStorage()
    const profile = storage.profiles[id]
    
    if (!profile) {
      return null
    }

    // Merge updates
    storage.profiles[id] = {
      ...profile,
      ...updates,
      id: profile.id, // Don't allow ID to be changed
      lastUsed: new Date()
    }

    this.saveStorage(storage)
    return storage.profiles[id]
  }

  /**
   * Check if a profile exists by email
   */
  hasProfileByEmail(email: string): boolean {
    const storage = this.getStorage()
    return Object.values(storage.profiles).some(
      (profile) => profile.email === email
    )
  }

  /**
   * Get profile by email
   */
  getProfileByEmail(email: string): AccountProfile | null {
    const storage = this.getStorage()
    return (
      Object.values(storage.profiles).find(
        (profile) => profile.email === email
      ) || null
    )
  }

  /**
   * Clear all profiles
   */
  clearAllProfiles(): void {
    localStorage.removeItem(STORAGE_KEY)
    Cookies.remove('token')
  }

  /**
   * Get profile count
   */
  getProfileCount(): number {
    const storage = this.getStorage()
    return Object.keys(storage.profiles).length
  }
}

// Export singleton instance
export const accountManager = AccountManager.getInstance()
