'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { DropdownSVG } from '@public/svg/shared'
import SearchModel from './searchModel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import LineTab from '@/components/ui/line-tab'
import { zUser, type User } from '@/types'

interface UserNameImage {
  name: string | null
  image: string | null
}

async function fetchNameImage(): Promise<UserNameImage | undefined> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user`,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    const userData: User = (await response.json()) as User
    const { success, data } = zUser.safeParse(userData)
    if (!success) {
      throw new Error('Invalid data')
    }
    return {
      name: data.name?.split(' ')[0] ?? data.email.split('@')[0],
      image: data.profilePictureUrl
    }
  } catch (error) {
    // eslint-disable-next-line no-console -- we need to log the error
    console.error(error)
  }
}

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isApple, setIsApple] = useState<boolean>(false)
  const [userData, setUserData] = useState<UserNameImage>({
    name: null,
    image: null
  })

  const pathname = usePathname()

  const settingsTabs = ['Workspace', 'Profile', 'Billing']
  const projectTabs = ['Secret', 'Variable']

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

    fetchNameImage()
      .then((data) => {
        if (data) {
          setUserData(data)
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      })
    document.addEventListener('keydown', down)
    return () => {
      document.removeEventListener('keydown', down)
    }
  }, [])

  return (
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
              {userData.name === null ? (
                <>
                  <span className="h-6 w-6 animate-pulse rounded-full bg-white/20" />
                  <span className="h-5 w-20 animate-pulse rounded bg-white/20" />
                </>
              ) : (
                <>
                  <Avatar>
                    <AvatarImage src={userData.image ?? ''} />
                    <AvatarFallback>{userData.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{userData.name}</span>
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
              <Link href="/settings?tab=workspace">
                <DropdownMenuItem>Workspace Settings</DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="px-4">
          {(pathname === '/settings' ||
            pathname.split('/')[1] === 'project') && (
            <LineTab
              customID="linetab"
              tabs={
                pathname.split('/')[1] === 'project'
                  ? projectTabs
                  : settingsTabs
              }
            />
          )}
        </div>
      </nav>
      <SearchModel isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}

export default Navbar
