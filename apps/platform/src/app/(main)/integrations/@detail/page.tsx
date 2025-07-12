/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ESLint incorrectly flags totalEventsCount comparison as always truthy */
'use client'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { EditTwoSVG, TrashWhiteSVG } from '@public/svg/shared'
import AvatarComponent from '@/components/common/avatar'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import { PageTitle } from '@/components/common/page-title'
import IntegrationIcon from '@/components/integrations/integrationIcon'
import IntegrationLoader from '@/components/integrations/IntegrationLoader'
import IntegrationTriggerList from '@/components/integrations/integrationTriggerList'
import UpdateIntegration from '@/components/integrations/updateIntegrationSheet'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { formatDate, formatText } from '@/lib/utils'
import {
  deleteIntegrationOpenAtom,
  editIntegrationOpenAtom,
  selectedIntegrationAtom
} from '@/store'
import { Button } from '@/components/ui/button'
import DeleteIntegrationDialog from '@/components/integrations/confirmDeleteIntegration'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

function IntegrationDetailsPage() {
  const router = useRouter()
  const [showAllEvents, setShowAllEvents] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [selectedIntegration, setSelectedIntegration] = useAtom(
    selectedIntegrationAtom
  )
  const [_isEditIntegrationsOpen, setIsEditIntegrationOpen] = useAtom(
    editIntegrationOpenAtom
  )
  const [_isDeleteIntegrationOpen, setIsDeleteIntegrationOpen] = useAtom(
    deleteIntegrationOpenAtom
  )
  const integrationSlug = selectedIntegration?.slug

  const getIntegrationDetails = useHttp(() => {
    if (!integrationSlug) {
      throw new Error('integrationSlug is required')
    }
    return ControllerInstance.getInstance().integrationController.getIntegration(
      { integrationSlug },
      {}
    )
  })

  const handleEditIntegration = useCallback(() => {
    if (!selectedIntegration) return

    setSelectedIntegration(selectedIntegration)
    setIsEditIntegrationOpen(true)
  }, [setSelectedIntegration, setIsEditIntegrationOpen, selectedIntegration])

  const handleDeleteIntegration = useCallback(() => {
    if (!selectedIntegration) return

    setSelectedIntegration(selectedIntegration)
    setIsDeleteIntegrationOpen(true)
  }, [setSelectedIntegration, setIsDeleteIntegrationOpen, selectedIntegration])

  useEffect(() => {
    if (!integrationSlug) {
      router.push('/integrations?tab=all')
      return
    }

    setIsLoading(true)
    getIntegrationDetails()
      .then(({ data, success }) => {
        if (success && data) {
          setSelectedIntegration(data)
        } else {
          router.push('/integrations')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [getIntegrationDetails, integrationSlug, router, setSelectedIntegration])

  const _refreshIntegrationData = useCallback(() => {
    getIntegrationDetails().then(({ data, success }) => {
      if (success && data) {
        setSelectedIntegration(data)
      }
    })
  }, [getIntegrationDetails, setSelectedIntegration])

  if (isLoading || !selectedIntegration) {
    return <IntegrationLoader />
  }

  const INITIAL_EVENTS_COUNT = 9
  const totalEventsCount = selectedIntegration.notifyOn.length
  const visibleEvents = showAllEvents
    ? selectedIntegration.notifyOn
    : selectedIntegration.notifyOn.slice(0, INITIAL_EVENTS_COUNT)

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
      <div className="w flex w-1/2 flex-col gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <IntegrationIcon
                className="h-14 w-14 p-2"
                type={selectedIntegration.type}
              />
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-white">
                  {selectedIntegration.name}
                </h1>
                <span className="text-sm text-white/60">
                  {formatText(selectedIntegration.type)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                onClick={handleDeleteIntegration}
              >
                <TrashWhiteSVG />
              </Button>
              <Button
                className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                onClick={handleEditIntegration}
              >
                <EditTwoSVG className="h-5 w-5 text-white/70 hover:text-white" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="mr-2 flex w-3/4 items-center gap-3 border-t border-white/10 pt-4">
              {selectedIntegration.lastUpdatedBy ? (
                <>
                  <AvatarComponent
                    name={
                      selectedIntegration.lastUpdatedBy.name || 'Unknown User'
                    }
                    profilePictureUrl={
                      selectedIntegration.lastUpdatedBy.profilePictureUrl || ''
                    }
                  />
                  <div className="flex flex-col text-sm text-white/70">
                    <div>
                      Last updated by{' '}
                      <span className="font-semibold text-white">
                        {selectedIntegration.lastUpdatedBy.name ||
                          'Unknown User'}
                      </span>
                    </div>
                    <div className="text-white/80">
                      {formatDate(
                        selectedIntegration.updatedAt ||
                          selectedIntegration.createdAt
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col text-sm text-white/70">
                  <div>No update information available</div>
                  <div className="text-white/80">
                    {formatDate(selectedIntegration.createdAt)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex w-1/4 items-center gap-2">
              <CopyToClipboard text={integrationSlug || ''} />
            </div>
          </div>
        </div>

        {/* Resync button */}
        <div className="p flex w-full items-center rounded-lg border border-white/10 bg-white/5 p-4  backdrop-blur-sm">
          <div className="mr-4 flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-white">Re-Sync</h2>
            <p className="text-sm text-white/60">
              Instantly synchronize all secrets and variables between Keyshade
              and your connected platform.
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled variant="secondary">
                  Sync Now
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="z-10 w-28 border-transparent bg-white/20 text-white"
                sideOffset={10}
              >
                <p className="text-sm text-white/90">
                  This feature is not available yet.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Event Subscription */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">
              Event Subscription
            </h2>
            <p className="text-sm text-white/60">
              These events will trigger the integration automatically.
            </p>
          </div>

          <div className="mb-6">
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
            {totalEventsCount > INITIAL_EVENTS_COUNT && (
              <Button
                className="bg-blue-400/w0 border border-white/20 text-sm font-medium text-blue-400 transition-colors hover:bg-transparent hover:text-blue-500"
                onClick={() => setShowAllEvents(!showAllEvents)}
              >
                {showAllEvents
                  ? 'Show less'
                  : `Show ${totalEventsCount - INITIAL_EVENTS_COUNT} more`}
              </Button>
            )}
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

      {/* Conditionally render dialogs when they are used */}
      <UpdateIntegration />
      <DeleteIntegrationDialog />
    </div>
  )
}

export default IntegrationDetailsPage
