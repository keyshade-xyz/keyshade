'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SidebarTabProps {
  name: string
  icon: React.JSX.Element
  link: string
  matchTo: string
  isCollapsed?: boolean
}

function SidebarTab({
  name,
  icon,
  link,
  matchTo,
  isCollapsed = false
}: SidebarTabProps): React.JSX.Element {
  const currentPath = usePathname()

  /**
   * Determines if a tab is active based on the current path.
   * It strips any query parameters from matchTo and checks if
   * the current path is equal to or starts with that base.
   */
  const isCurrentActive = (matchPattern: string): boolean => {
    if (!matchPattern || typeof matchPattern !== 'string') {
      return false
    }
    const basePath = matchPattern.split('?')[0]
    return currentPath === basePath || currentPath.startsWith(`${basePath}/`)
  }

  const isActive = isCurrentActive(matchTo)
  const tabLink = (
    <Link
      aria-current={isActive ? 'page' : undefined}
      aria-label={name}
      className={cn(
        'relative flex w-full items-center rounded-xl p-2.5 text-base font-medium text-neutral-400 transition-colors hover:text-white',
        isCollapsed ? 'justify-center' : 'gap-x-3'
      )}
      href={link}
    >
      {icon}
      {!isCollapsed && <span>{name}</span>}
    </Link>
  )

  if (!isCollapsed) {
    return tabLink
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tabLink}</TooltipTrigger>
      <TooltipContent side="right">{name}</TooltipContent>
    </Tooltip>
  )
}

export default SidebarTab
