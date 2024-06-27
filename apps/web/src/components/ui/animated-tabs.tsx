'use client'

import { motion } from 'framer-motion'
import React from 'react'
import { cn } from '@/utils/cn'
import type { PriceTabDataType } from '@/types'

function AnimatedTab({
  tabs,
  activeTab,
  setActiveTab
}: {
  tabs: Readonly<PriceTabDataType>
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
}): React.JSX.Element {
  return (
    <div
      className="flex rounded-full border-[1px] border-white border-opacity-[.06] bg-white bg-opacity-[.08] p-1"
      style={{
        borderRadius: 99,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        background:
          'radial-gradient(89.06% 89.06% at 50% 100%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.00) 48.41%), rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(1.5px)'
      }}
    >
      {tabs.map((tab) => (
        <button
          className={cn(
            activeTab === tab.id ? '' : 'hover:text-white',
            `font-mediumtransition relative rounded-full px-3 py-1.5 text-sm focus-visible:outline-2 ${tab.special ? 'text-brandBlue/70 hover:text-brandBlue/80' : ' text-white/70 hover:text-white/80'}`
          )}
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id)
          }}
          style={{
            WebkitTapHighlightColor: 'transparent'
          }}
          type="button"
        >
          {activeTab === tab.id && (
            <motion.span
              className="absolute inset-0 z-10 rounded-full border-[1px] border-[#A9A3C2] border-opacity-[.05] bg-white bg-opacity-[.08]"
              layoutId="bubble"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          {tab.label}{' '}
          {tab.tag ? (
            <span
              className="ml-1 h-6 w-14 rounded-full border-[1px] border-white border-opacity-[0.04] bg-opacity-[.06] p-1 text-xs tracking-wide"
              style={{
                background:
                  'radial-gradient(89.06% 89.06% at 50% 100%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.00) 48.41%), rgba(255, 255, 255, 0.08)'
              }}
            >
              {tab.tag}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export default AnimatedTab
