// eslint-disable-next-line camelcase -- IGNORE ---
import { Geist_Mono } from 'next/font/google'
import type { ButtonHTMLAttributes } from 'react'
import React from 'react'

interface CtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '700']
})

export default function CtaButton({
  children,
  ...props
}: CtaButtonProps): React.JSX.Element {
  return (
    <button
      className={`${geistMono.className} relative m-1 flex gap-1 overflow-hidden rounded-xl border-4 border-[#0B3038] bg-[#0B798C] bg-gradient-to-b from-white/[6%] to-transparent px-3 py-2 text-[#D4F7FF] shadow-lg shadow-[#005EFC]/[25%]`}
      type="button"
      {...props}
    >
      <div className="absolute left-0 top-0 h-full w-full shadow-[inset_-1px_5px_5px_-1px_rgba(255,255,255,_0.20)]" />
      <div className="flex items-center gap-2">{children}</div>
      <div className="absolute bottom-0 left-0 h-full w-full shadow-[inset_0px_-1px_3px_0px_rgba(255,255,255,_0.32)]" />
    </button>
  )
}
