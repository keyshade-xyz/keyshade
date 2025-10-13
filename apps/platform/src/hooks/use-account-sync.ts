/**
 * Hook to sync the active account profile with the user atom
 * This ensures the user context is loaded from the account manager on app initialization
 */

import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { accountManager } from '@/lib/account-manager'
import { userAtom } from '@/store'

export function useAccountSync() {
  const setUser = useSetAtom(userAtom)

  useEffect(() => {
    // Load the active profile from account manager
    const activeProfile = accountManager.getActiveProfile()
    
    if (activeProfile) {
      setUser({
        id: activeProfile.id,
        email: activeProfile.email,
        name: activeProfile.name || undefined,
        profilePictureUrl: activeProfile.profilePictureUrl || undefined
      })
    }
  }, [setUser])
}
