import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useEffect, useState } from 'react'
import type { Integration } from '@keyshade/schema'
import { useRouter } from 'next/navigation'
import EmptyIntegration from '../emptyIntegration'
import IntegrationIcon from '../integrationIcon'
import {
  integrationsOfWorkspaceAtom,
  selectedIntegrationAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import { formatText } from '@/lib/utils'
import ErrorCard from '@/components/shared/error-card'

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
  const setSelectedIntegration = useSetAtom(selectedIntegrationAtom)
  const [integrations, setIntegrations] = useAtom(integrationsOfWorkspaceAtom)
  const [loading, setLoading] = useState<boolean>(true)
  const [runCounts, setRunCounts] = useState<Record<string, number>>({})
  const router = useRouter()

  const isAuthorizedToReadIntegration =
    selectedWorkspace?.entitlements.canReadIntegrations
  const MAX_INTEGRATION_NAME_LENGTH = 25

  const getAllIntegrations = useHttp(() =>
    ControllerInstance.getInstance().integrationController.getAllIntegrations(
      { workspaceSlug: selectedWorkspace!.slug },
      {}
    )
  )

  const getAllRunsOfIntegration = useHttp((integrationSlug: string) =>
    ControllerInstance.getInstance().integrationController.getAllIntegrationRuns(
      { integrationSlug },
      {}
    )
  )

  const handleClick = useCallback(
    (integration: Integration) => {
      setSelectedIntegration(integration)
      if (selectedWorkspace?.slug && integration.slug) {
        router.push(`/integrations/${integration.slug}`)
      }
    },
    [router, setSelectedIntegration, selectedWorkspace]
  )

  useEffect(() => {
    if (!isAuthorizedToReadIntegration) return
    if (selectedWorkspace.slug) {
      getAllIntegrations()
        .then(({ data, success }) => {
          if (success && data) {
            setIntegrations(data.items)
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
    isAuthorizedToReadIntegration
  ])

  useEffect(() => {
    integrations.forEach((integration) =>
      getAllRunsOfIntegration(integration.slug).then(({ data, success }) => {
        if (success && data) {
          setRunCounts((prev) => ({
            ...prev,
            [integration.slug]:
              typeof data.metadata.totalCount === 'number'
                ? data.metadata.totalCount
                : 0
          }))
        }
      })
    )
  }, [integrations, getAllRunsOfIntegration])

  // Move conditional return AFTER all hooks
  if (!isAuthorizedToReadIntegration) {
    return <ErrorCard tab="integrations" />
  }

  const hasIntegrations = integrations.length > 0

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col gap-y-4">
        <IntegrationListItemSkeleton />
        <IntegrationListItemSkeleton />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full justify-center">
      {hasIntegrations ? (
        <div className="mr-auto grid w-full max-w-7xl grid-cols-3 justify-between gap-3">
          {integrations.map((integration) => (
            <div
              className="w-full cursor-pointer rounded-md transition-all duration-150 ease-out hover:bg-white/5"
              key={integration.id}
              onClick={() => handleClick(integration)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleClick(integration)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex h-fit flex-col items-center gap-3 rounded-lg bg-white/5 p-5 transition-all duration-150 ease-out hover:bg-white/10">
                <div className="mx-0 flex w-full items-center justify-between gap-3">
                  <IntegrationIcon
                    className="h-12 w-12"
                    type={integration.type}
                  />

                  <div className="flex w-2/5 flex-shrink-0 items-start justify-center gap-x-2 pl-4">
                    <CopyToClipboard text={integration.slug} />
                  </div>
                </div>
                <div className="mt-2 flex w-full min-w-0 flex-col items-start justify-start gap-1">
                  <h2
                    className="truncate text-xl font-semibold"
                    title={integration.name}
                  >
                    {integration.name.length > MAX_INTEGRATION_NAME_LENGTH
                      ? `${integration.name.slice(0, MAX_INTEGRATION_NAME_LENGTH)}…`
                      : integration.name}
                  </h2>
                  <p
                    className="truncate text-sm text-white/60"
                    title={formatText(integration.type)}
                  >
                    {formatText(integration.type)} | Total no of triggers:{' '}
                    {runCounts[integration.slug]}
                  </p>
                </div>
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
