'use client'
import { motion } from 'framer-motion'
import React, { useCallback } from 'react'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TabProps {
  text: string
  selected: boolean
  // setSelected: React.Dispatch<React.SetStateAction<string>>
  searchParams: ReadonlyURLSearchParams
  customID: string
  icon?: React.ReactNode
  route?: string
}

function Tab({
  text,
  selected,
  route,
  // setSelected,
  searchParams,
  customID,
  icon
}: TabProps): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )
  return (
    <button
      className={cn(
        `border-jet-black relative flex min-w-[114.6px] cursor-pointer justify-center rounded-md border p-3 text-sm text-white/50 transition-colors duration-300`
      )}
      onClick={() => {
        // setSelected(text)
        router.push(
          `${pathname}?${createQueryString('tab', route || text.toLocaleLowerCase())}`
        )
      }}
      type="button"
    >
      <span
        className={`${selected ? 'text-primary-200' : 'text-neutral-500'} relative z-10 flex place-content-center gap-2 transition-colors`}
      >
        {icon ? <span className="h-4 w-4">{icon}</span> : null}
        {text}
      </span>
      {selected ? (
        <motion.div
          className="absolute left-0 top-0 flex size-full items-end justify-center"
          layoutId={`${customID}linetab`}
          transition={{ type: 'spring', duration: 0.4, bounce: 0, delay: 0.1 }}
        >
          <span className="bg-primary-1100 border-primary-300/30 z-0 h-full w-full rounded-lg border" />
        </motion.div>
      ) : null}
    </button>
  )
}

interface TabConfig {
  id: string
  label: string
  icon?: React.ReactNode
  route?: string
}

interface LineTabsProps {
  customID: string
  tabs: TabConfig[]
}

function LineTab({ customID, tabs }: LineTabsProps): React.JSX.Element {
  const searchParams = useSearchParams()
  const search = searchParams.get('tab')

  return (
    <div
      className={cn(
        'border-black-500/25 flex h-fit flex-wrap items-center gap-2'
      )}
    >
      {tabs.map((tab) => (
        <Tab
          customID={customID}
          icon={tab.icon}
          key={tab.id}
          route={tab.route}
          searchParams={searchParams}
          selected={search?.toLocaleLowerCase() === tab.id.toLocaleLowerCase()}
          text={tab.label}
        />
      ))}
    </div>
  )
}

export default LineTab
