'use client'
import { useAtomValue } from 'jotai'
import React from 'react'
import {
  deleteIntegrationOpenAtom,
  editIntegrationOpenAtom,
  selectedIntegrationAtom
} from '@/store'
import IntegrationList from '@/components/integrations/integrationList'
import UpdateIntegration from '@/components/integrations/updateIntegrationSheet'
import DeleteIntegrationDialog from '@/components/integrations/confirmDeleteIntegration'

function IntegrationsPage(): React.JSX.Element {
  const selectedIntegration = useAtomValue(selectedIntegrationAtom)
  const isEditIntegrationsOpen = useAtomValue(editIntegrationOpenAtom)
  const isDeleteIntegrationOpen = useAtomValue(deleteIntegrationOpenAtom)

  return (
    <div className="flex flex-col gap-y-10">
      <div>
        <h1 className="text-[1.75rem] font-semibold ">All Integrations</h1>
        <p className="mt-2 text-sm text-white/60">
          Supercharge your workflow and connect the tools you use everyday.
        </p>
      </div>

      {/* Integrations list */}
      <IntegrationList />

      {/* Update Integration sheet */}
      {isEditIntegrationsOpen && selectedIntegration ? (
        <UpdateIntegration />
      ) : null}

      {/* Delete Integration Dialog*/}
      {isDeleteIntegrationOpen && selectedIntegration ? (
        <DeleteIntegrationDialog />
      ) : null}
    </div>
  )
}

export default IntegrationsPage
