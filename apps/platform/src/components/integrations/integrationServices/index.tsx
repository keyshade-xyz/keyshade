'use client'
import React, { useCallback, useMemo } from 'react'
import { Integrations } from '@keyshade/common'
import { useAtom, useSetAtom } from 'jotai'
import type { Integration } from '@keyshade/schema'
import IntegrationIcon from '../integrationIcon'
import CreateIntegration from '../createIntegration'
import { Button } from '@/components/ui/button'
import { createIntegrationOpenAtom, createIntegrationTypeAtom } from '@/store'
import Visible from '@/components/common/visible'

export default function IntegrationServices(): React.JSX.Element {
  const integrations = useMemo(() => Object.values(Integrations), [])
  const [createIntegrationModelOpen, setCreateIntegrationModelOpen] = useAtom(
    createIntegrationOpenAtom
  )
  const setCreateIntegrationType = useSetAtom(createIntegrationTypeAtom)

  const handleConnect = useCallback(
    (type: Integration['type']) => {
      setCreateIntegrationModelOpen(true)
      setCreateIntegrationType(type)
    },
    [setCreateIntegrationModelOpen, setCreateIntegrationType]
  )
  const hasIntegrations = integrations.length > 0

  return (
    <div>
      <Visible if={hasIntegrations}>
        <div className="grid grid-cols-3 gap-5">
          {integrations.map((integration) => {
            const isActive = integration.isActive
            return (
              <div
                className={`h-full rounded-lg bg-[#222425] p-4 py-2 text-white ${!isActive && 'opacity-50'}`}
                key={integration.type}
              >
                <div className="mb-5 mt-3 flex items-start justify-between">
                  <IntegrationIcon
                    className="h-12 w-12"
                    type={integration.type}
                  />
                  <Button
                    className={`${!isActive && 'cursor-not-allowed'}`}
                    onClick={() => isActive && handleConnect(integration.type)}
                    variant="secondary"
                  >
                    {isActive ? 'Connect' : 'Coming Soon'}
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-medium">{integration.name}</h3>
                  <p className="text-sm text-white/60">
                    {integration.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Visible>

      {/* create Integration flow */}
      <Visible if={createIntegrationModelOpen}>
        <CreateIntegration />
      </Visible>
    </div>
  )
}
