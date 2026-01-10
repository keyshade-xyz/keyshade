'use client'
import React from 'react'
import { Button } from '@/components/ui/button'

function PromotionBanner() {
  const handleRedirect = () => {
    window.location.href = '/'
  }
  return (
    <div
      className="flex h-fit w-[50vw] gap-x-2 rounded-2xl border-2 border-[#B3EBF2]/10 px-7 py-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] backdrop-blur-3xl"
      style={{
        background: `linear-gradient(130.61deg, rgba(12, 86, 96, 0.4) 10%, rgba(25, 177, 198, 0) 80%),
        linear-gradient(0deg, rgba(12, 86, 96, 0.2) 58.4%, rgba(12, 86, 96, 0.3) 80%)`
      }}
    >
      <div className="flex flex-col justify-center gap-y-2">
        <h2 className="text-xl font-semibold">
          The better .env file replacement
        </h2>
        <p className="text-xs text-white/60">
          Stop DMing your Environment variables, and start syncing them securely
          & instantly. We make sure your secrets are safe and secure. We provide
          a secure way of storing and managing your secrets.
        </p>
      </div>
      <Button
        className="bg-[#EFFCFF] text-[#125D67]"
        onClick={handleRedirect}
        variant="secondary"
      >
        Try Keyshade for free
      </Button>
    </div>
  )
}
export default PromotionBanner
