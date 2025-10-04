import React from 'react'

interface RoleBadgeProps {
  color: string
  children: React.ReactNode
  key: string | number
}

export default function RoleBadge({ color, children, key }: RoleBadgeProps) {
  return (
    <span
      className="items-center justify-center rounded-full px-2 py-1 text-purple-200"
      key={key}
      style={{
        backgroundColor: `${color}33`,
        border: `1px solid ${color}`,
        color
      }}
    >
      {children}
    </span>
  )
}
