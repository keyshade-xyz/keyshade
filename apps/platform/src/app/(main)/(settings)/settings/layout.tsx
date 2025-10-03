'use client'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SettingsLayoutProps {
  profile: React.ReactNode
  invites: React.ReactNode
  accounts: React.ReactNode
}

function SettingsTabs({ profile, invites, accounts }: SettingsLayoutProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'
  return (
    <>
      {tab === 'profile' && profile}
      {tab === 'invites' && invites}
      {tab === 'accounts' && accounts}
    </>
  )
}

export default function SettingsLayout({
  profile,
  invites,
  accounts
}: SettingsLayoutProps): React.JSX.Element {
  return (
    <main>
      <Suspense fallback={null}>
        <SettingsTabs invites={invites} profile={profile} accounts={accounts} />
      </Suspense>
    </main>
  )
}
