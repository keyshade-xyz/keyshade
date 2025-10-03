'use client'

import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Check, ChevronDown, Plus, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { accountManager, type AccountProfile } from '@/lib/account-manager'
import { userAtom } from '@/store'
import AvatarComponent from '@/components/common/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export default function AccountSwitcher() {
  const [user, setUser] = useAtom(userAtom)
  const [profiles, setProfiles] = useState<AccountProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<AccountProfile | null>(
    null
  )

  // Load profiles on mount
  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = () => {
    const allProfiles = accountManager.getAllProfiles()
    const active = accountManager.getActiveProfile()
    setProfiles(allProfiles)
    setActiveProfile(active)
  }

  const handleSwitchAccount = async (profileId: string) => {
    try {
      const profile = accountManager.switchProfile(profileId)
      
      if (!profile) {
        toast.error('Failed to switch account')
        return
      }

      // Update user atom with profile data
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name || undefined,
        profilePictureUrl: profile.profilePictureUrl || undefined
      })

      setActiveProfile(profile)
      toast.success(`Switched to ${profile.name || profile.email}`)

      // Reload the page to fetch data for the new account
      window.location.reload()
    } catch (error) {
      console.error('Error switching account:', error)
      toast.error('Failed to switch account')
    }
  }

  const handleAddAccount = () => {
    // Navigate to auth page to add new account
    window.location.href = '/auth?mode=add'
  }

  const handleRemoveAccount = async (
    profileId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()

    if (profiles.length === 1) {
      toast.error('Cannot remove the last account')
      return
    }

    const profile = accountManager.getProfile(profileId)
    if (!profile) return

    const confirmed = window.confirm(
      `Are you sure you want to remove ${profile.name || profile.email}?`
    )

    if (confirmed) {
      accountManager.removeProfile(profileId)
      loadProfiles()

      // If we removed the active profile, update user atom
      if (activeProfile?.id === profileId) {
        const newActive = accountManager.getActiveProfile()
        if (newActive) {
          setUser({
            id: newActive.id,
            email: newActive.email,
            name: newActive.name || undefined,
            profilePictureUrl: newActive.profilePictureUrl || undefined
          })
          window.location.reload()
        }
      }

      toast.success('Account removed')
    }
  }

  if (profiles.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-x-2 rounded-xl bg-[#2A2C2E] px-3 py-2 hover:bg-[#3A3C3E]"
        >
          {activeProfile ? (
            <>
              <AvatarComponent
                name={activeProfile.name || activeProfile.email}
                profilePictureUrl={activeProfile.profilePictureUrl || ''}
              />
              <span className="max-w-[150px] truncate">
                {activeProfile.name || activeProfile.email}
              </span>
              <ChevronDown className="h-4 w-4" />
            </>
          ) : (
            <>
              <span className="h-6 w-6 animate-pulse rounded-full bg-white/20" />
              <span className="h-5 w-20 animate-pulse rounded bg-white/20" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleSwitchAccount(profile.id)}
            className="flex items-center justify-between gap-2 py-2"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <AvatarComponent
                name={profile.name || profile.email}
                profilePictureUrl={profile.profilePictureUrl || ''}
              />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium">
                  {profile.name || 'Unnamed'}
                </span>
                <span className="truncate text-xs text-white/60">
                  {profile.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeProfile?.id === profile.id && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {profiles.length > 1 && (
                <button
                  onClick={(e) => handleRemoveAccount(profile.id, e)}
                  className="rounded p-1 hover:bg-white/10"
                  title="Remove account"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleAddAccount}>
          <Plus className="mr-2 h-4 w-4" />
          Add another account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
