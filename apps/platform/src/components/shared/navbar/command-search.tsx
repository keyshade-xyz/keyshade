import type { Dispatch, SetStateAction } from 'react'
import React, { useEffect } from 'react'
import { Search } from 'lucide-react'
import { useIsAppleDevice } from '@/hooks/use-is-apple-device'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

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
      className="text-muted-foreground flex gap-x-2 rounded-xl bg-[#2A2C2E] px-2 py-[0.63rem] text-sm"
      onClick={toggleSearch}
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
  )
}
