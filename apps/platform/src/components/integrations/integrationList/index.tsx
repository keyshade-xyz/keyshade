import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useEffect, useState } from 'react'
import type { Integration } from '@keyshade/schema'
import Link from 'next/link'
import EmptyIntegration from '../emptyIntegration'
import IntegrationIcon from '../integrationIcon'
import {
  deleteIntegrationOpenAtom,
  editIntegrationOpenAtom,
  integrationsOfWorkspaceAtom,
  selectedIntegrationAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import ErrorCard from '@/components/shared/error-card'

type ErrorMessage = { header: string; body: string } | null

function IntegrationListItemSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="h-20 w-[23%] rounded-lg bg-white/5" />
      <div className="h-20 w-[23%] rounded-lg bg-white/5" />
      <div className="h-20 w-[23%] rounded-lg bg-white/5" />
      <div className="h-20 w-[23%] rounded-lg bg-white/5" />
    </div>
  )
}

function IntegrationList() {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [integrations, setIntegrations] = useAtom(integrationsOfWorkspaceAtom)
  const setSelectedIntegration = useSetAtom(selectedIntegrationAtom)
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(null)
  const [loading, setLoading] = useState<boolean>(true)
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
    if (selectedWorkspace?.slug) {
      getAllIntegrations()
        .then(({ data, success, error }) => {
          if (success && data) {
            setIntegrations(data.items)
          }
          if (error) {
            const errorMsg = error.message
            const parsedError = JSON.parse(errorMsg) as ErrorMessage
            setErrorMessage(parsedError)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [
    selectedWorkspace,
    getAllIntegrations,
    selectedWorkspace?.slug,
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

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col gap-y-4">
        <IntegrationListItemSkeleton />
        <IntegrationListItemSkeleton />
      </div>
    )
  }
  if (!hasIntegrations && errorMessage) {
    return (
      <ErrorCard description={errorMessage.body} header={errorMessage.header} />
    )
  }

  return (
    <div className="flex h-full w-full justify-center">
      {hasIntegrations ? (
        <div className="mr-auto grid w-full max-w-7xl grid-cols-3 justify-between gap-3">
          {integrations.map((integration) => (
            <ContextMenu key={integration.id}>
              <ContextMenuTrigger>
                <Link href={`/integrations?details=${integration.slug}`}>
                  <div className="flex h-[6rem] items-center justify-between rounded-lg bg-white/5 px-5 py-4 transition-all duration-150 ease-out hover:bg-white/10">
                    <div className="flex items-center gap-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700">
                        <IntegrationIcon
                          className="h-6 w-6"
                          type={integration.type}
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">
                          {integration.name}
                        </h2>
                        <p className="text-sm text-white/60">
                          {integration.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start justify-center gap-x-2">
                      <CopyToClipboard text={integration.slug} />
                    </div>
                  </div>
                </Link>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <ContextMenuItem
                  inset
                  onClick={() => handleEditIntegration(integration)}
                >
                  Edit
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-white/15" />
                <ContextMenuItem
                  inset
                  onClick={() => handleDeleteIntegration(integration)}
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      ) : (
        <EmptyIntegration />
      )}
    </div>
  )
}

export default IntegrationList
