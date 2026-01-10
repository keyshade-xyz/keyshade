import type { Dispatch, SetStateAction } from 'react'
import React, { useEffect } from 'react'
import { Search } from 'lucide-react'
import { useIsAppleDevice } from '@/hooks/use-is-apple-device'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { GeistSansFont } from '@/fonts'

interface CommandSearchProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export default function CommandSearch({ setIsOpen }: CommandSearchProps) {
  const { isApple } = useIsAppleDevice()
  const [isSearchOpen, toggleSearch] = useKeyboardShortcut({ key: 'k' })

  // Sync the local state with the parent state
  useEffect(() => {
    setIsOpen(isSearchOpen)
  }, [isSearchOpen, setIsOpen])

  return (
    <button
      className={`${GeistSansFont.className} text-muted-foreground bg-night-c border-white/8 flex cursor-pointer gap-x-2 rounded-xl border-[0.5px] px-2 py-[0.63rem] text-sm`}
      onClick={toggleSearch}
      type="button"
    >
      <div className="flex items-center">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <span className="2xl:w-100 w-fit text-left text-neutral-500">
          Search a Project, Secret or anything...
        </span>
      </div>

      <kbd className="text-muted-foreground bg-jet-black pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-sm px-1.5 py-px font-mono text-xs font-medium text-neutral-500 opacity-100">
        <span className={isApple ? 'text-lg leading-[0px] ' : ''}>
          {isApple ? '⌘' : 'ctrl'}
        </span>{' '}
        K
      </kbd>
    </button>
  )
}
