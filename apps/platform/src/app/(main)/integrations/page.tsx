'use client'
import { useAtomValue } from 'jotai'
import React from 'react'
import { PageTitle } from '@/components/common/page-title'
import CreateIntegration from '@/components/integrations/createIntegration'
import {
  deleteIntegrationOpenAtom,
  editIntegrationOpenAtom,
  selectedIntegrationAtom,
  selectedWorkspaceAtom
} from '@/store'
import IntegrationList from '@/components/integrations/integrationList'
import UpdateIntegration from '@/components/integrations/updateIntegrationSheet'
import DeleteIntegrationDialog from '@/components/integrations/confirmDeleteIntegration'

function IntegrationsPage(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedIntegration = useAtomValue(selectedIntegrationAtom)
  const isEditIntegrationsOpen = useAtomValue(editIntegrationOpenAtom)
  const isDeleteIntegrationOpen = useAtomValue(deleteIntegrationOpenAtom)

  return (
    <div className="flex flex-col gap-y-10">
      <PageTitle title={`${selectedWorkspace?.name} | Integrations`} />
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">Integrations</h1>
        <CreateIntegration />
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
