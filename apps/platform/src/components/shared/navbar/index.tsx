'use client'

import { Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { DropdownSVG } from '@public/svg/shared'
import { SecretSVG, VariableSVG, EnvironmentSVG } from '@public/svg/dashboard'
import type { User } from '@keyshade/schema'
import { useAtomValue } from 'jotai'
import SearchModel from './searchModel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import LineTab from '@/components/ui/line-tab'
import { selectedProjectAtom } from '@/store'
import { userAtom } from '@/store'
import AvatarComponent from '@/components/common/avatar'

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isApple, setIsApple] = useState<boolean>(false)
  const user = useAtomValue(userAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const pathname = usePathname()

  const settingsTabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'billing', label: 'Billing' }
  ]

  const projectTabs = [
    {
      id: 'secret',
      label: 'Secret',
      icon: <SecretSVG />
    },
    {
      id: 'variable',
      label: 'Variable',
      icon: <VariableSVG />
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: <EnvironmentSVG />
    }
  ]

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    ;(() => {
      // a self-invoking function to check if the user is using an Apple device
      const userAgent = window.navigator.userAgent
      setIsApple(userAgent.includes('Mac OS X'))
    })()

    document.addEventListener('keydown', down)
    return () => {
      document.removeEventListener('keydown', down)
    }
  }, [])

  const handleLogOut = useCallback((): void => {
    // Expire cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    document.cookie =
      'isOnboardingFinished=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

    // Clear local store
    localStorage.clear()

    // Redirect to login page
    // Using window.location because at times next router throws up this error: https://nextjs.org/docs/messages/next-router-not-mounted
    window.location.href = '/auth'
  }, [])

  return (
    <>
      {user ? (
        <>
          <nav className="flex flex-col gap-y-2 border-b border-[#DDDDDD]/[24%]">
            <div className="flex justify-between p-4">
              <button
                className="text-muted-foreground flex gap-x-2 rounded-xl bg-[#2A2C2E] px-2 py-[0.63rem] text-sm"
                onClick={() => {
                  setIsOpen(true)
                }}
                type="button"
              >
                <div className="flex items-center">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <span className="w-fit text-left text-white/80 2xl:w-[25rem]">
                    Search a Project, Secrect or anything...
                  </span>
                </div>

                <kbd className="text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-[#161819] p-2 font-mono text-xs font-medium opacity-100">
                  <span className={isApple ? 'text-base leading-[0px]' : ''}>
                    {isApple ? '⌘' : 'ctrl'}
                  </span>{' '}
                  K
                </kbd>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className=" flex items-center gap-x-2 rounded-xl bg-[#2A2C2E] px-3 py-2">
                  {!user.name ? (
                    <>
                      <span className="h-6 w-6 animate-pulse rounded-full bg-white/20" />
                      <span className="h-5 w-20 animate-pulse rounded bg-white/20" />
                    </>
                  ) : (
                    <>
                      <AvatarComponent name={user?.name} />
                      <span>{user.name}</span>
                    </>
                  )}
                  <DropdownSVG />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/settings?tab=profile">
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                  </Link>
                  <Link href="/settings?tab=billing">
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                  </Link>
                  <Link href="/teams">
                    <DropdownMenuItem>Team</DropdownMenuItem>
                  </Link>
                  <Link href="/settings?tab=profile">
                    <DropdownMenuItem>User Settings</DropdownMenuItem>
                  </Link>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogOut}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="px-4">
              {pathname !== '/' &&
                (pathname === '/settings' ||
                  pathname.split('/')[2] === selectedProject?.slug) && (
                  <LineTab
                    customID="linetab"
                    tabs={
                      pathname.split('/')[2] === selectedProject?.slug
                        ? projectTabs
                        : settingsTabs
                    }
                  />
                )}
            </div>
          </nav>
          <SearchModel isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
      ) : null}
    </>
  )
}

export default Navbar
