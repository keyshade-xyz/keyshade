import { Logo } from '@public/shared'
import React from 'react'

function SharePageHeader() {
  return (
    <div className="flex flex-col items-center gap-y-2">
      <Logo />
      <div className="flex flex-col items-center justify-center gap-y-1">
        <h1 className="inline-block bg-gradient-to-b from-[#B3EBF2] to-[#999999] bg-clip-text text-5xl font-semibold text-transparent drop-shadow-[0_0px_4px_rgba(0,0,0,0.25)]">
          Share a Secret Securely
        </h1>
        <p className="text-white/60">
          Your secret will self-destruct after it&apos;s viewed
        </p>
      </div>
    </div>
  )
}

export default SharePageHeader
