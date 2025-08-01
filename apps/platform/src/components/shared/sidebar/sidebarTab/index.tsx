'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { motion } from 'framer-motion'

interface SidebarTabProps {
  name: string
  icon: React.JSX.Element
  link: string
  matchTo: string[]
}

function SidebarTab({
  name,
  icon,
  link,
  matchTo
}: SidebarTabProps): React.JSX.Element {
  const currentPath = usePathname()

  /**
   * Determines if a tab is active based on the current path.
   * Checks if the current path matches any of the patterns in matchTo array.
   */
  const isCurrentActive = (matchPatterns: string[]): boolean => {
    return matchPatterns.some((pattern) => {
      const basePath = pattern.split('?')[0]
      const currentBasePath = currentPath.split('?')[0]
      return (
        currentBasePath === basePath ||
        currentBasePath.startsWith(`${basePath}/`)
      )
    })
  }

  return (
    <Link
      className="relative flex w-full gap-x-3 rounded-md p-[0.625rem] capitalize transition-colors hover:text-white/60"
      href={link}
    >
      {isCurrentActive(matchTo) && (
        <motion.span
          className="absolute inset-0 z-10 bg-white/10 mix-blend-difference"
          layoutId="bubble"
          style={{ borderRadius: 6 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      {icon} {name}
    </Link>
  )
}

export default SidebarTab
