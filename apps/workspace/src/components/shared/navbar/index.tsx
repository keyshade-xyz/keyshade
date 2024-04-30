'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { DropdownSVG } from '@public/svg/shared'
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
import SearchModel from './searchModel'

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isApple, setIsApple] = useState<boolean>(false)
  const pathname = usePathname()

  const tabs = ['Workspace', 'Profile', 'Billing']

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
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              Kriptonian <DropdownSVG />
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
          {pathname === '/settings' && (
            <LineTab customID="linetab" tabs={tabs} />
          )}
        </div>
      </nav>
      <SearchModel isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}

export default Navbar
