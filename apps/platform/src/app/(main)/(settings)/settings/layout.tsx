'use client'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SettingsLayoutProps {
  billing: React.ReactNode
  profile: React.ReactNode
}

function SettingsTabs({ billing, profile }: SettingsLayoutProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'
  return (
    <>
      {tab === 'profile' && profile}
      {tab === 'billing' && billing}
    </>
  )
}

export default function SettingsLayout({
  billing,
  profile
}: SettingsLayoutProps): React.JSX.Element {
  return (
    <main>
      <Suspense fallback={null}>
        <SettingsTabs billing={billing} profile={profile} />
      </Suspense>
    </main>
  )
}
