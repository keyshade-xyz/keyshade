import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useEffect, useState } from 'react'
import type { Integration } from '@keyshade/schema'
import { useRouter } from 'next/navigation'
import IntegrationIcon from '../integrationIcon'
import EmptyIntegration from '../emptyIntegration'
import {
  integrationsOfWorkspaceAtom,
  selectedIntegrationAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import ErrorCard from '@/components/shared/error-card'
import { formatText } from '@/lib/utils'

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
  const setSelectedIntegration = useSetAtom(selectedIntegrationAtom)
  const [integrations, setIntegrations] = useAtom(integrationsOfWorkspaceAtom)
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  const MAX_INTEGRATION_NAME_LENGTH = 25

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
    setIntegrations
  ])

  const handleClick = useCallback(
    (integration: Integration) => {
      setSelectedIntegration(integration)
      if (selectedWorkspace?.slug && integration.slug) {
        router.push(`/${selectedWorkspace.slug}/${integration.slug}`)
      }
    },
    [router, setSelectedIntegration, selectedWorkspace]
  )

  const hasIntegrations = integrations.length > 0

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
                    {integration.notifyOn.length}
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
