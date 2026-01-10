import React from 'react'

export default function ShortcutKeyBox({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <span className="bg-jet-black border-white/16 flex items-center justify-center rounded-md border p-1 text-xs">
      {children}
    </span>
  )
}
