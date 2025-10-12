'use client'
import React, { useCallback, useMemo, useState } from 'react'
import { Integrations } from '@keyshade/common'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type { Integration } from '@keyshade/schema'
import IntegrationIcon from '../integrationIcon'
import CreateIntegration from '../createIntegration'
import { Button } from '@/components/ui/button'
import {
  createIntegrationOpenAtom,
  createIntegrationTypeAtom,
  selectedWorkspaceAtom
} from '@/store'
import Visible from '@/components/common/visible'
import { Input } from '@/components/ui/input'

export default function IntegrationServices(): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('')
  const integrations = useMemo(() => Object.values(Integrations), [])

  const filteredIntegrations = useMemo(() => {
      if (!searchTerm.trim()) {
          return integrations
      }
      return integrations.filter((integration) =>
                                 integration.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
  }, [integrations, searchTerm])


  const [createIntegrationModelOpen, setCreateIntegrationModelOpen] = useAtom(
    createIntegrationOpenAtom
  )
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const setCreateIntegrationType = useSetAtom(createIntegrationTypeAtom)
  const isAuthorizedToCreateIntegration =
    selectedWorkspace?.entitlements.canCreateIntegrations ?? true

  const handleConnect = useCallback(
    (type: Integration['type']) => {
      setCreateIntegrationModelOpen(true)
      setCreateIntegrationType(type)
    },
    [setCreateIntegrationModelOpen, setCreateIntegrationType]
  )

  const hasIntegrations = filteredIntegrations.length > 0


  return (
    <div>
    {/* Search Input */}
      <div className="mb-6">
        <Input
          className="w-full max-w-md"
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search integrations by type (e.g., disc for Discord)..."
          value={searchTerm}
        />
      </div>
      <Visible if={hasIntegrations}>
        <div className="grid grid-cols-3 gap-5">
        {filteredIntegrations.map((integration) => {
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
                    disabled={!isAuthorizedToCreateIntegration}
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
      <Visible if={!hasIntegrations && searchTerm.trim()}>
        <div className="py-8 text-center">
          <p className="text-white/60">
            No integrations found matching &quot;{searchTerm}&quot;
          </p>
        </div>
      </Visible>

      {/* create Integration flow */}
      <Visible if={createIntegrationModelOpen}>
        <CreateIntegration />
      </Visible>
    </div>
  )
}
