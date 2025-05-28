'use client'
import React, { Suspense } from 'react'
import { useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
import { Integrations } from '@keyshade/common'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import SetupIntegration from './@setup/page'
import IntegrationsPage from './page'
import { PageTitle } from '@/components/common/page-title'
import { selectedWorkspaceAtom } from '@/store'

function IntegrationsContent(): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const searchParams = useSearchParams()
  const integrationType: IntegrationTypeEnum | null = searchParams.get(
    'setup'
  ) as IntegrationTypeEnum | null

  const isValidIntegrationType =
    integrationType !== null && Integrations[integrationType]

  return (
    <main>
      <div className="flex flex-col gap-y-10">
        <PageTitle title={`${currentWorkspace?.name} | Integrations`} />
        {isValidIntegrationType ? (
          <SetupIntegration
            integrationName={Integrations[integrationType].name}
            integrationType={integrationType}
          />
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
