'use client'
import { useAtom, useAtomValue } from 'jotai'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { PageTitle } from '@/components/common/page-title'
import IntegrationLoader from '@/components/integrations/IntegrationLoader'
import IntegrationTriggerList from '@/components/integrations/integrationTriggerList'
import UpdateIntegration from '@/components/integrations/updateIntegrationSheet'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedIntegrationAtom, selectedWorkspaceAtom } from '@/store'
import DeleteIntegrationDialog from '@/components/integrations/confirmDeleteIntegration'
import ProjectEnvironmentList from '@/components/integrations/projectEnvironmentList'
import ResyncIntegration from '@/components/integrations/resyncIntegration'
import EventSubscriptions from '@/components/integrations/eventSubcriptions'
import IntegrationDetails from '@/components/integrations/IntegrationDetails'
import ErrorCard from '@/components/shared/error-card'
import Visible from '@/components/common/visible'

function IntegrationDetailsPage() {
  const router = useRouter()
  const { integrationSlug }: { integrationSlug: string } = useParams()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [selectedIntegration, setSelectedIntegration] = useAtom(
    selectedIntegrationAtom
  )

  const isAuthorizedToRead = currentWorkspace?.entitlements.canReadIntegrations

  const getIntegrationDetails = useHttp(async () => {
    if (!integrationSlug) {
      throw new Error('Integration slug is required to fetch details.')
    }
    return ControllerInstance.getInstance().integrationController.getIntegration(
      { integrationSlug },
      {}
    )
  })

  const handleUpdateSuccess = useCallback(() => {
    getIntegrationDetails().then(({ data, success }) => {
      if (success && data) {
        setSelectedIntegration(data)
      }
    })
  }, [getIntegrationDetails, setSelectedIntegration])

  useEffect(() => {
    if (!integrationSlug) {
      router.push('/integrations?tab=all')
      return
    }
    if (!isAuthorizedToRead) return
    setIsLoading(true)
    getIntegrationDetails()
      .then(({ data, success }) => {
        if (success && data) {
          setSelectedIntegration(data)
        } else {
          router.push('/integrations?tab=all')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [
    getIntegrationDetails,
    integrationSlug,
    router,
    setSelectedIntegration,
    isAuthorizedToRead
  ])

  if (!isAuthorizedToRead) {
    return <ErrorCard tab="integrations" />
  }
  if (isLoading || !selectedIntegration) {
    return <IntegrationLoader />
  }

  return (
    <div className="flex w-full gap-4 pt-2">
      <PageTitle title={`Integration | ${integrationSlug}`} />
      <div className="w flex w-1/2 flex-col gap-4">
        {/* Integration Details */}
        <IntegrationDetails selectedIntegration={selectedIntegration} />

        {/* Resync button */}
        <ResyncIntegration />

        {/* Event Subscription */}
        <EventSubscriptions selectedIntegration={selectedIntegration} />

        {/* Project and Environment Info */}
        <Visible if={Boolean(currentWorkspace)}>
          <ProjectEnvironmentList
            currentWorkspace={currentWorkspace}
            selectedIntegration={selectedIntegration}
          />
        </Visible>
      </div>

      {/* Integration Trigger List Component */}
      <IntegrationTriggerList integration={selectedIntegration} />

      {/* Update and delete dialogs */}
      <UpdateIntegration onUpdateSuccess={handleUpdateSuccess} />
      <DeleteIntegrationDialog />
    </div>
  )
}

export default IntegrationDetailsPage
