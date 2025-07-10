'use client'
import React from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import ProjectEnvironmentStep from '../projectEnvironmentStep'
import { IntegrationStep } from '@/hooks/use-integration'
import {
  SetupIntegrationProvider,
  useSetupIntegrationContext
} from '@/components/contexts/setup-integration-context'
import BasicInfoStep from '@/components/integrations/BasicInfoStep'

interface SetupIntegrationProps {
  integrationType: IntegrationTypeEnum
  integrationName: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SetupIntegrationSteps({
  integrationType,
  integrationName,
  open,
  onOpenChange
}: SetupIntegrationProps) {
  const { currentStep } = useSetupIntegrationContext()

  const handleCancel = () => {
    onOpenChange?.(false)
  }

  const handleSuccess = () => {
    onOpenChange?.(false)
  }

  return (
    <>
      <BasicInfoStep
        integrationName={integrationName}
        integrationType={integrationType}
        onCancel={handleCancel}
        open={open ? currentStep === IntegrationStep.BASIC_INFO : null}
      />

      <ProjectEnvironmentStep
        integrationName={integrationName}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        open={open ? currentStep === IntegrationStep.PROJECT_ENVIRONMENT : null}
      />
    </>
  )
}

export default function SetupIntegration({
  integrationType,
  integrationName,
  open,
  onOpenChange
}: SetupIntegrationProps) {
  return (
    <SetupIntegrationProvider
      integrationName={integrationName}
      integrationType={integrationType}
    >
      <SetupIntegrationSteps
        integrationName={integrationName}
        integrationType={integrationType}
        onOpenChange={onOpenChange}
        open={open}
      />
    </SetupIntegrationProvider>
  )
}
