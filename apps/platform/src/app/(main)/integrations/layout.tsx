'use client'
import React, { Suspense } from 'react'
import { useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
import { Integrations } from '@keyshade/common'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import SetupIntegration from './@setup/page'
import IntegrationsPage from './page'
import IntegrationDetailsPage from './@details/page'
import { PageTitle } from '@/components/common/page-title'
import { selectedWorkspaceAtom } from '@/store'

function IntegrationsContent(): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const params = useSearchParams()

  const setupType = params.get('setup') as IntegrationTypeEnum | null
  const integrationSlug = params.get('details')

  const isSetup = setupType && Integrations[setupType]
  const isDetails = Boolean(integrationSlug)

  return (
    <main>
      <div className="flex flex-col gap-y-10">
        <PageTitle title={`${currentWorkspace?.name} | Integrations`} />
        {isDetails ? (
          <IntegrationDetailsPage integrationSlug={integrationSlug!} />
        ) : isSetup ? (
          <SetupIntegration
            integrationName={Integrations[setupType].name}
            integrationType={setupType as IntegrationTypeEnum}
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
