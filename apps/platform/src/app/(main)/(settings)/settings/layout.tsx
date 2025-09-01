'use client'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SettingsLayoutProps {
  profile: React.ReactNode
  invites: React.ReactNode
}

function SettingsTabs({ profile, invites }: SettingsLayoutProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'
  return (
    <>
      {tab === 'profile' && profile}
      {tab === 'invites' && invites}
    </>
  )
}

export default function SettingsLayout({
  profile,
  invites
}: SettingsLayoutProps): React.JSX.Element {
  return (
    <main>
      <Suspense fallback={null}>
        <SettingsTabs invites={invites} profile={profile} />
      </Suspense>
    </main>
  )
}
