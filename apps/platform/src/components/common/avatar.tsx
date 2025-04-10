import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface AvatarProps {
  name: string
  profilePictureUrl: string | null
  className?: string
}

const getInitials = (name: string): string => {
  const [firstName, lastName] = name.split(' ')

  const lastNameInitial =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- False positive
    lastName !== undefined
      ? lastName.charAt(0).toUpperCase()
      : firstName.charAt(1).toLowerCase()

  return firstName.charAt(0).toUpperCase() + lastNameInitial
}

export default function AvatarComponent({
  name,
  className,
  profilePictureUrl
}: AvatarProps) {
  return (
    <Avatar className={className ?? 'h-6 w-6'}>
      <AvatarImage
        src={profilePictureUrl === null ? undefined : profilePictureUrl}
      />
      <AvatarFallback className="font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
