'use client'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { EditTwoSVG } from '@public/svg/shared'
import AvatarComponent from '@/components/common/avatar'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import { PageTitle } from '@/components/common/page-title'
import IntegrationIcon from '@/components/integrations/integrationIcon'
import IntegrationLoader from '@/components/integrations/IntegrationLoader'
import IntegrationTriggerList from '@/components/integrations/integrationTriggerList'
import UpdateIntegration from '@/components/integrations/updateIntegrationSheet'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { formatDate } from '@/lib/utils'
import { editIntegrationOpenAtom, selectedIntegrationAtom } from '@/store'
import { Button } from '@/components/ui/button'

function IntegrationDetailsPage({
  integrationSlug
}: {
  integrationSlug: string
}) {
  const router = useRouter()
  const [showAllEvents, setShowAllEvents] = useState<boolean>(false)

  const [selectedIntegration, setSelectedIntegration] = useAtom(
    selectedIntegrationAtom
  )
  const [isEditIntegrationsOpen, setIsEditIntegrationOpen] = useAtom(
    editIntegrationOpenAtom
  )

  const getIntegrationDetails = useHttp(() =>
    ControllerInstance.getInstance().integrationController.getIntegration(
      { integrationSlug },
      {}
    )
  )

  const handleEditIntegration = useCallback(() => {
    if (!selectedIntegration) return

    setSelectedIntegration(selectedIntegration)
    setIsEditIntegrationOpen(true)
  }, [setSelectedIntegration, setIsEditIntegrationOpen, selectedIntegration])

  useEffect(() => {
    if (!integrationSlug) {
      return
    }
    getIntegrationDetails().then(({ data, success }) => {
      if (success && data) {
        setSelectedIntegration(data)
      } else {
        router.push('/integrations')
      }
    })
  }, [getIntegrationDetails, integrationSlug, router, setSelectedIntegration])

  const refreshIntegrationData = useCallback(() => {
    getIntegrationDetails().then(({ data, success }) => {
      if (success && data) {
        setSelectedIntegration(data)
      }
    })
  }, [getIntegrationDetails, setSelectedIntegration])

  if (!selectedIntegration) {
    return <IntegrationLoader />
  }

  const INITIAL_EVENTS_COUNT = 6
  const visibleEvents = showAllEvents
    ? selectedIntegration.notifyOn
    : selectedIntegration.notifyOn.slice(0, INITIAL_EVENTS_COUNT)

  const hasMoreEvents =
    selectedIntegration.notifyOn.length > INITIAL_EVENTS_COUNT

  const getEnvironmentText = () => {
    const environmentNames = selectedIntegration.environments?.length
      ? selectedIntegration.environments.map((env) => env.name).join(', ')
      : 'all environments'
    const projectName = selectedIntegration.project?.name || 'all projects'

    return (
      <p>
        Watching events of{' '}
        <span className="font-semibold">{environmentNames}</span> from{' '}
        <span className="font-semibold">{projectName}</span>
      </p>
    )
  }

  return (
    <div className="flex w-full gap-4 pt-2">
      <PageTitle title={`Integration | ${integrationSlug}`} />

      <div className="flex w-2/5 flex-col gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IntegrationIcon
                className="h-12 w-12 rounded-full border border-white/20 bg-white/10 p-1"
                type={selectedIntegration.type}
              />

              <h1 className="mb-2 text-3xl font-bold text-white">
                {selectedIntegration.name}
              </h1>
            </div>
            <Button
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
              onClick={handleEditIntegration}
            >
              <EditTwoSVG className="h-5 w-5 text-white/70 hover:text-white" />
            </Button>
          </div>

          {/* Last Updated Info */}
          <div className="flex justify-between">
            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <AvatarComponent
                name={selectedIntegration.lastUpdatedBy.name}
                profilePictureUrl={
                  selectedIntegration.lastUpdatedBy.profilePictureUrl
                }
              />
              <div className="flex flex-col text-sm text-white/70">
                <div>
                  Last updated by{' '}
                  <span className="font-semibold text-white">
                    {selectedIntegration.lastUpdatedBy.name}
                  </span>
                </div>
                <div className="text-white/80">
                  {formatDate(
                    selectedIntegration.updatedAt ||
                      selectedIntegration.createdAt
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CopyToClipboard text={integrationSlug} />
            </div>
          </div>
        </div>

        {/* Event Subscription */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Event Subscription
          </h2>

          <div className="mb-6">
            <p className="mb-3 text-sm text-white/70">Listening for events:</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {visibleEvents.map((event) => (
                <span
                  className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/15"
                  key={event}
                >
                  {event
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>

            {hasMoreEvents ? (
              <Button
                className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
                onClick={() => setShowAllEvents(!showAllEvents)}
              >
                {showAllEvents
                  ? `Show less`
                  : `Show ${selectedIntegration.notifyOn.length - INITIAL_EVENTS_COUNT} more`}
              </Button>
            ) : null}
          </div>

          {/* Project and Environment Info */}
          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-sm text-white/70">
              Environment and project:
            </p>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <span>{getEnvironmentText()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Trigger List Component */}
      <IntegrationTriggerList integration={selectedIntegration} />

      {/* Update Integration sheet */}
      {isEditIntegrationsOpen ? (
        <UpdateIntegration onUpdateSuccess={refreshIntegrationData} />
      ) : null}
    </div>
  )
}

export default IntegrationDetailsPage
