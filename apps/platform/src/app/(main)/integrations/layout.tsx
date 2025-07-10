'use client'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useAtomValue } from 'jotai'
import IntegrationsPage from './@created/page'
import AllAvailableIntegrations from './@overview/page'
import IntegrationDetailsPage from './@details/page'
import { selectedWorkspaceAtom } from '@/store'
import { PageTitle } from '@/components/common/page-title'

function DetailedIntegrationPage(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'applications'

  return (
    <main>
      <PageTitle title={`${selectedWorkspace?.name} | Integrations`} />
      {tab === 'overview' && <AllAvailableIntegrations />}
      {tab === 'all' && <IntegrationsPage />}
      {tab === 'details' && <IntegrationDetailsPage />}
    </main>
  )
}

export default DetailedIntegrationPage
