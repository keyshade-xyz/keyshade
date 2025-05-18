'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAtomValue } from 'jotai'
import {
  SecretSVG,
  VariableSVG,
  EnvironmentSVG,
  FolderSVG
} from '@public/svg/dashboard'
import { DropdownSVG } from '@public/svg/shared'
import { posthog } from 'posthog-js'
import { toast } from 'sonner'
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
import AvatarComponent from '@/components/common/avatar'
import { selectedProjectAtom, selectedWorkspaceAtom, userAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isApple, setIsApple] = useState<boolean>(false)

  const user = useAtomValue(userAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const pathname = usePathname()

  const TAB_CONFIGS = {
    settings: [
      { id: 'profile', label: 'Profile' },
      { id: 'billing', label: 'Billing' },
      { id: 'invites', label: 'Invites' }
    ],
    project: [
      { id: 'overview', label: 'Overview', icon: <FolderSVG /> },
      { id: 'secret', label: 'Secret', icon: <SecretSVG /> },
      { id: 'variable', label: 'Variable', icon: <VariableSVG /> },
      { id: 'environment', label: 'Environment', icon: <EnvironmentSVG /> }
    ],
    // members: [
    //   { id: 'joined', label: 'Joined' },
    //   { id: 'invited', label: 'Invited' }
    // ]
  }

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

  const logOut = useHttp(() =>
    ControllerInstance.getInstance().authController.logOut()
  )

  const handleLogOut = async () => {
    toast.loading('Logging out...')
    
    try {
      const { success } = await logOut()
      if (success) {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

        localStorage.clear()
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

  const getProjectPath = (): string =>
    selectedWorkspace?.slug && selectedProject?.slug
      ? `/${selectedWorkspace.slug}/${selectedProject.slug}`
      : ''

  const shouldRenderTab = (): boolean => {
    const allowedPaths = ['/settings', '/members', getProjectPath()] // modify the list based on what paths you want to have tab
    return pathname !== '/' && allowedPaths.includes(pathname)
  }

  const renderTabs = (): Tab[] => {
    // You need to update the case if you want to have a tab for a specific path
    switch (pathname) {
      case `/${selectedWorkspace?.slug}/${selectedProject?.slug}`:
        return TAB_CONFIGS.project

      case '/settings':
        return TAB_CONFIGS.settings

      // case '/members':
      //   return TAB_CONFIGS.members

      default:
        return []
    }
  }

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
                  + K
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
                      <AvatarComponent
                        name={user.name}
                        profilePictureUrl={user.profilePictureUrl || ''}
                      />
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
                  <Link href="/settings?tab=invites">
                    <DropdownMenuItem>View Invites</DropdownMenuItem>
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
              {shouldRenderTab() && (
                <LineTab customID="linetab" tabs={renderTabs()} />
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
