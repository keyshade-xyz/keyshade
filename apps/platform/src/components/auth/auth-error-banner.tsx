import React from 'react'
import { ErrorInfoSVG } from '@public/svg/shared'

interface AuthErrorBannerProps {
  reason: string | null
}

/**
 * A component that displays an error banner for oauth authentication errors. Returns null if no reason is provided.
 */
export default function AuthErrorBanner({ reason }: AuthErrorBannerProps) {
  if (!reason) return null

  return (
    <div className="rounded-md border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
      <div className="flex items-center justify-around gap-4">
        <ErrorInfoSVG />
        <div>
          <strong className="font-medium">Login Error:</strong>{' '}
          <span className="opacity-90">{reason}</span>
        </div>
      </div>
    </div>
  )
}
