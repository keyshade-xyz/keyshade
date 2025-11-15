'use client'

import { useState } from 'react'
import SearchModel from './searchModel'
import ProfileMenu from './profile-menu'
import CommandSearch from './command-search'
import { GeistSansFont } from '@/fonts'

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <>
      <nav
        className={`${GeistSansFont.className} flex flex-col gap-y-2 border-b border-white/10`}
      >
        <div className="flex items-center justify-between p-4">
          <CommandSearch setIsOpen={setIsOpen} />
          <ProfileMenu />
        </div>
      </nav>
      <SearchModel isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}

export default Navbar
