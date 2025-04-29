'use client'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SettingsLayoutProps {
  billing: React.ReactNode
  profile: React.ReactNode
  invites: React.ReactNode
}

function SettingsTabs({ billing, profile, invites }: SettingsLayoutProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'
  return (
    <>
      {tab === 'profile' && profile}
      {tab === 'billing' && billing}
      {tab === 'invites' && invites}
    </>
  )
}

export default function SettingsLayout({
  billing,
  profile,
  invites
}: SettingsLayoutProps): React.JSX.Element {
  return (
    <main>
      <Suspense fallback={null}>
        <SettingsTabs billing={billing} invites={invites} profile={profile} />
      </Suspense>
    </main>
  )
}
