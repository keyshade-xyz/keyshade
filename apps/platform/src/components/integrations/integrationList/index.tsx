import {
  DiscordSVG,
  IntegrationSVG,
  SlackSVG,
  TrashWhiteSVG
} from '@public/svg/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useEffect } from 'react'
import { Pen } from 'lucide-react'
import type { Integration } from '@keyshade/schema'
import EmptyIntegration from '../emptyIntegration'
import {
  deleteIntegrationOpenAtom,
  editIntegrationOpenAtom,
  integrationsOfWorkspaceAtom,
  selectedIntegrationAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

//add new integrations
function IntegrationIcon({ type }: { type: string }) {
  switch (type) {
    case 'DISCORD':
      return <DiscordSVG className="h-6 w-6" />
    case 'SLACK':
      return <SlackSVG className="h-6 w-6" />
    default:
      return <IntegrationSVG className="h-6 w-6" />
  }
}

function IntegrationList() {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [integrations, setIntegrations] = useAtom(integrationsOfWorkspaceAtom)
  const setSelectedIntegration = useSetAtom(selectedIntegrationAtom)
  const [isEditIntegrationOpen, setIsEditIntegrationOpen] = useAtom(
    editIntegrationOpenAtom
  )
  const [isDeleteIntegrationOpen, setIsDeleteIntegrationOpen] = useAtom(
    deleteIntegrationOpenAtom
  )

  const getAllIntegrations = useHttp(() =>
    ControllerInstance.getInstance().integrationController.getAllIntegrations(
      { workspaceSlug: selectedWorkspace!.slug },
      {}
    )
  )
  useEffect(() => {
    getAllIntegrations().then(({ data, success }) => {
      if (success && data) {
        setIntegrations(data.items)
      }
    })
  }, [
    getAllIntegrations,
    setIntegrations,
    isEditIntegrationOpen,
    isDeleteIntegrationOpen
  ])

  const hasIntegrations = integrations.length > 0

  const handleEditIntegration = useCallback(
    (integration: Integration) => {
      setSelectedIntegration(integration)
      setIsEditIntegrationOpen(true)
    },
    [setSelectedIntegration, setIsEditIntegrationOpen]
  )

  const handleDeleteIntegration = useCallback(
    (integration: Integration) => {
      setSelectedIntegration(integration)
      setIsDeleteIntegrationOpen(true)
    },
    [setSelectedIntegration, setIsDeleteIntegrationOpen]
  )

  return (
    <div className="flex h-full w-full justify-center">
      {hasIntegrations ? (
        <div className="mr-auto flex w-full max-w-md flex-col gap-y-2">
          {integrations.map((integration) => (
            <div
              className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-800 p-4"
              key={integration.id}
            >
              <div className="flex items-center gap-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700">
                  <IntegrationIcon type={integration.type} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{integration.name}</h2>
                  <p className="text-sm text-white/60">{integration.type}</p>
                </div>
              </div>
              <div className="flex items-start justify-center gap-x-2">
                <span className="rounded-full bg-neutral-700 px-2 py-1 text-xs text-white/80">
                  {integration.slug}
                </span>
                <button
                  onClick={() => handleEditIntegration(integration)}
                  type="button"
                >
                  <Pen size={20} />
                </button>
                <button
                  onClick={() => handleDeleteIntegration(integration)}
                  type="button"
                >
                  <TrashWhiteSVG />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyIntegration />
      )}
    </div>
  )
}

export default IntegrationList
