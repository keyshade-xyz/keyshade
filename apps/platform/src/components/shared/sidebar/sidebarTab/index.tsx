'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { motion } from 'framer-motion'

interface SidebarTabProps {
  name: string
  icon: React.JSX.Element
  link: string
  matchTo: string
}

function SidebarTab({
  name,
  icon,
  link,
  matchTo
}: SidebarTabProps): React.JSX.Element {
  const currentPath = usePathname()
  /**
   * Determines the background color for a tab based on the current active path.
   * @param tabName - The name of the tab.
   * @returns The background color for the tab.
   */
  const isCurrentActive = (tabName: string): boolean => {
    if (currentPath.split('/')[1] === tabName.toLowerCase()) {
      return true
    }
    return false
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
