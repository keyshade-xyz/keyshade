import Link from 'next/link'
import { posthog } from 'posthog-js'
import React from 'react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import { DropdownSVG } from '@public/svg/shared'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { accountManager } from '@/lib/account-manager'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import AvatarComponent from '@/components/common/avatar'
import { userAtom } from '@/store'

export default function ProfileMenu() {
  const user = useAtomValue(userAtom)

  const logOut = useHttp(() =>
    ControllerInstance.getInstance().authController.logOut()
  )

  const handleLogOut = async () => {
    toast.loading('Logging out...')

    try {
      const { success } = await logOut()
      if (success) {
        document.cookie =
          'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

        // Clear all account data
        accountManager.clearAllProfiles()
        posthog.reset()
        toast.success('Logged out successfully')

        // Redirect to login page
        // Using window.location because at times next router throws up this error: https://nextjs.org/docs/messages/next-router-not-mounted
        window.location.href = '/auth'
      }
    } finally {
      toast.dismiss()
    }
  }

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className=" flex items-center gap-x-2 rounded-xl bg-[#2A2C2E] px-3 py-2">
            {!user.name ? (
              <>
                <span className="h-6 w-6 animate-pulse rounded-full bg-white/20" />
                <span className="h-5 w-20 animate-pulse rounded bg-white/20" />
              </>
            ) : (
              <>
                <AvatarComponent
                  name={user.name}
                  profilePictureUrl={user.profilePictureUrl || ''}
                />
                <span>{user.name}</span>
              </>
            )}
            <DropdownSVG />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings?tab=profile">
              <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
            <Link href="/settings?tab=accounts">
              <DropdownMenuItem>Manage Accounts</DropdownMenuItem>
            </Link>
            <Link href="/settings?tab=invites">
              <DropdownMenuItem>View Invites</DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </>
  )
}
