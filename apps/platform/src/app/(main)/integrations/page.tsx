'use client'
import { DiscordSVG, IntegrationSVG, SlackSVG } from '@public/svg/shared'
import { useAtom, useAtomValue } from 'jotai'
import React, { useEffect } from 'react'
import { PageTitle } from '@/components/common/page-title'
import CreateIntegration from '@/components/integrations/createIntegration'
import EmptyIntegration from '@/components/integrations/emptyIntegration'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { integrationsOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'

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

function IntegrationsPage(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [integrations, setIntegrations] = useAtom(integrationsOfWorkspaceAtom)

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
  }, [getAllIntegrations, setIntegrations])

  const hasIntegrations = integrations.length > 0

  return (
    <div className="flex flex-col gap-y-10">
      <PageTitle title={`${selectedWorkspace?.name} | Integrations`} />
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">Integrations</h1>
        <CreateIntegration />
      </div>

      <div className="flex h-full w-full justify-center">
        {hasIntegrations ? (
          <div className="mr-auto flex w-full max-w-sm flex-col gap-y-2">
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
                    <h2 className="text-lg font-semibold">
                      {integration.name}
                    </h2>
                    <p className="text-sm text-white/60">{integration.type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-x-2">
                  <span className="rounded-full bg-neutral-700 px-2 py-1 text-xs text-white/80">
                    {integration.slug}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyIntegration />
        )}
      </div>
    </div>
  )
}

export default IntegrationsPage
