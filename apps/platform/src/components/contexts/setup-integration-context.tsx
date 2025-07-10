'use client'
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { useSetupIntegration } from '@/hooks/use-integration'

interface SetupIntegrationContextType {
  formState: ReturnType<typeof useSetupIntegration>['formState']
  currentStep: ReturnType<typeof useSetupIntegration>['currentStep']
  isLoading: ReturnType<typeof useSetupIntegration>['isLoading']
  config: ReturnType<typeof useSetupIntegration>['config']
  projectPrivateKey: ReturnType<typeof useSetupIntegration>['projectPrivateKey']
  privateKeyLoading: ReturnType<typeof useSetupIntegration>['privateKeyLoading']
  handlers: ReturnType<typeof useSetupIntegration>['handlers']
}

const SetupIntegrationContext =
  createContext<SetupIntegrationContextType | null>(null)

interface SetupIntegrationProviderProps {
  children: ReactNode
  integrationType: IntegrationTypeEnum
  integrationName: string
}

export function SetupIntegrationProvider({
  children,
  integrationType,
  integrationName
}: SetupIntegrationProviderProps) {
  const integrationData = useSetupIntegration(integrationType, integrationName)

  return (
    <SetupIntegrationContext.Provider value={integrationData}>
      {children}
    </SetupIntegrationContext.Provider>
  )
}

export function useSetupIntegrationContext() {
  const context = useContext(SetupIntegrationContext)
  if (!context) {
    throw new Error(
      'useSetupIntegrationContext must be used within a SetupIntegrationProvider'
    )
  }
  return context
}
