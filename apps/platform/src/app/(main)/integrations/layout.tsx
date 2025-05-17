'use client'
import React, { Suspense } from 'react'
import { useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
import SetupIntegration from './@setup/page'
import IntegrationsPage from './page'
import { selectedWorkspaceAtom } from '@/store'
import { PageTitle } from '@/components/common/page-title'

//update it while adding new integrations :)
const VALID_INTEGRATION_TYPES = ['DISCORD', 'SLACK']

function IntegrationsContent(): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const searchParams = useSearchParams()
  const setupParam = searchParams.get('setup')

  const isValidIntegrationType =
    setupParam !== null &&
    VALID_INTEGRATION_TYPES.includes(setupParam.toUpperCase())

  return (
    <main>
      <div className="flex flex-col gap-y-10">
        <PageTitle title={`${currentWorkspace?.name} | Integrations`} />
        {isValidIntegrationType ? (
          <SetupIntegration setupType={setupParam} />
        ) : (
          <IntegrationsPage />
        )}
      </div>
    </main>
  )
}

export default function IntegrationsLayout(): React.JSX.Element {
  return (
    <main>
      <Suspense fallback={null}>
        <IntegrationsContent />
      </Suspense>
    </main>
  )
}
