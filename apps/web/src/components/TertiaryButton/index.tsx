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

export default function TertiaryButton({
  children,
  ...props
}: CtaButtonProps): React.JSX.Element {
  return (
    <button
      className={`${geistMono.className} flex items-center gap-3 rounded-[8px] border border-white/[8%] bg-[#99EEFF14] px-4 py-2 text-white`}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
