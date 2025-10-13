'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, UserPlus, Check } from 'lucide-react'
import { accountManager, type AccountProfile } from '@/lib/account-manager'
import AvatarComponent from '@/components/common/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function AccountManagement() {
  const [profiles, setProfiles] = useState<AccountProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<AccountProfile | null>(
    null
  )

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

      setActiveProfile(profile)
      toast.success(`Switched to ${profile.name || profile.email}`)
      
      // Reload to apply the new account context
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error switching account:', error)
      toast.error('Failed to switch account')
    }
  }

  const handleRemoveAccount = (profileId: string) => {
    if (profiles.length === 1) {
      toast.error('Cannot remove the last account')
      return
    }

    const profile = accountManager.getProfile(profileId)
    if (!profile) return

    const confirmed = window.confirm(
      `Are you sure you want to remove ${profile.name || profile.email}? This action cannot be undone.`
    )

    if (confirmed) {
      const removed = accountManager.removeProfile(profileId)
      
      if (removed) {
        loadProfiles()
        toast.success('Account removed successfully')
        
        // If we removed the active profile, reload the page
        if (activeProfile?.id === profileId) {
          setTimeout(() => {
            window.location.reload()
          }, 500)
        }
      } else {
        toast.error('Failed to remove account')
      }
    }
  }

  const handleAddAccount = () => {
    window.location.href = '/auth?mode=add'
  }

  const formatLastUsed = (date: Date) => {
    const now = new Date()
    const lastUsed = new Date(date)
    const diffMs = now.getTime() - lastUsed.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Management</h2>
        <p className="mt-2 text-white/60">
          Manage multiple accounts and switch between them seamlessly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
          <CardDescription>
            You have {profiles.length} account{profiles.length !== 1 ? 's' : ''}{' '}
            configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.map((profile, index) => (
            <React.Fragment key={profile.id}>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-4">
                  <AvatarComponent
                    name={profile.name || profile.email}
                    profilePictureUrl={profile.profilePictureUrl || ''}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {profile.name || 'Unnamed Account'}
                      </span>
                      {activeProfile?.id === profile.id && (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-500">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white/60">
                      {profile.email}
                    </span>
                    <span className="text-xs text-white/40">
                      Last used: {formatLastUsed(profile.lastUsed)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeProfile?.id !== profile.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchAccount(profile.id)}
                    >
                      Switch
                    </Button>
                  )}
                  {profiles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAccount(profile.id)}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {index < profiles.length - 1 && <Separator />}
            </React.Fragment>
          ))}

          <Button
            onClick={handleAddAccount}
            variant="outline"
            className="w-full"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Another Account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Account Management Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-white/70">
          <p>
            • <strong>Multiple Accounts:</strong> You can add multiple Keyshade
            accounts and switch between them without logging out.
          </p>
          <p>
            • <strong>Secure Storage:</strong> Your account credentials are
            securely stored in your browser's local storage.
          </p>
          <p>
            • <strong>Easy Switching:</strong> Click on any account to instantly
            switch to it and access its workspaces and projects.
          </p>
          <p>
            • <strong>Active Account:</strong> The active account is marked with
            a green badge and is used for all operations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
