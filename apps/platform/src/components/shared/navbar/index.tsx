'use client'

import { useState } from 'react'
import SearchModel from './searchModel'
import ProfileMenu from './profile-menu'
import LineTabController from './line-tab-controller'
import CommandSearch from './command-search'

function Navbar(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <>
      <nav className="flex flex-col gap-y-2 border-b border-white/10">
        <div className="flex justify-between p-4">
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
