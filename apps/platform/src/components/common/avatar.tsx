import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface AvatarProps {
  name: string
  profilePictureUrl: string | null
  className?: string
}

export default function AvatarComponent({
  name,
  className,
  profilePictureUrl: src
}: AvatarProps) {
  return (
    <Avatar className={className ?? 'h-6 w-6'}>
      <AvatarImage src={src === null ? undefined : src} />
      <AvatarFallback className="font-semibold">
        {name.charAt(0).toUpperCase() + name.slice(1, 2).toLowerCase()}
      </AvatarFallback>
    </Avatar>
  )
}
