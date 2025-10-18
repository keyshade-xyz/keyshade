'use client'

import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import SearchModel from './searchModel'
import ProfileMenu from './profile-menu'
import LineTabController from './line-tab-controller'
import CommandSearch from './command-search'
import { selectedWorkspaceAtom } from '@/store'
import { GeistSansFont } from '@/fonts'

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const currentPath = usePathname()

  const headingData = [
    {
      name: 'Dashboard',
      link: '/',
      matchTo: '/'
    },
    {
      name: 'Integrations',
      link: '/integrations?tab=overview',
      matchTo: '/integrations'
    },
    {
      name: 'Members',
      link: '/members?tab=joined',
      matchTo: '/members'
    },
    {
      name: 'Roles',
      link: '/roles',
      matchTo: '/roles'
    },

    {
      name: 'Billing',
      link: `/${selectedWorkspace?.slug}/billing`,
      matchTo: `/${selectedWorkspace?.slug}/billing`
    },
    {
      name: 'Settings',
      link: `/${selectedWorkspace?.slug}/settings`,
      matchTo: `/${selectedWorkspace?.slug}/settings`
    }
  ]

  const activeHeading = headingData.find((heading) => {
    if (!heading.matchTo || typeof heading.matchTo !== 'string') {
      return false
    }
    const basePath = heading.matchTo.split('?')[0]
    return currentPath === basePath || currentPath.startsWith(`${basePath}/`)
  })?.name

  return (
    <>
      <nav
        className={`${GeistSansFont.className} flex flex-col gap-y-2 border-b border-white/10`}
      >
        <div className="flex items-center justify-between p-4">
          <h1 className="text-[28px]">{activeHeading}</h1>
          <CommandSearch setIsOpen={setIsOpen} />
          <ProfileMenu />
        </div>
        <LineTabController />
      </nav>
      <SearchModel isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}

export default Navbar
