'use client'
import { useSearchParams } from 'next/navigation'
import React from 'react'

interface SettingsLayoutProps {
  // params: { slug: string }
  billing: React.ReactNode
  profile: React.ReactNode
}

function SettingsLayout({
  // params,
  billing,
  profile
}: SettingsLayoutProps): React.JSX.Element {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'
  return (
    <main>
      {tab === 'profile' && profile}
      {tab === 'billing' && billing}
    </main>
  )
}

export default SettingsLayout
