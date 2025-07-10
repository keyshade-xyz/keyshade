'use client'
import React from 'react'
import { ChevronLeft } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
import ProjectEnvironmentMapping from '@/components/integrations/ProjectEnvironmentMapping'
import { useSetupIntegrationContext } from '@/components/contexts/setup-integration-context'

interface ProjectEnvironmentStepProps {
  integrationName: string
  open?: boolean
  onCancel: () => void
  onSuccess: () => void
}

export default function ProjectEnvironmentStep({
  integrationName,
  open,
  onCancel,
  onSuccess
}: ProjectEnvironmentStepProps) {
  const {
    formState,
    config,
    projectPrivateKey,
    privateKeyLoading,
    isLoading,
    handlers
  } = useSetupIntegrationContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handlers.handleSubmit(e)
    if (success) {
      onSuccess()
    }
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-transparent bg-[#18181B]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            Connect Project & Environment
          </AlertDialogTitle>
          <AlertDialogDescription>
            Select the project and environments you want to connect with your{' '}
            {integrationName} integration. This determines where your
            integration will receive updates from.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form className="flex flex-col gap-6 py-4" onSubmit={handleSubmit}>
          {/* Project and Environment Selection */}
          {config.isMappingRequired ? (
            <ProjectEnvironmentMapping
              keyMapping={formState.mappings}
              manualPrivateKey={formState.manualPrivateKey}
              onEnvironmentChange={handlers.handleEnvironmentChange}
              onKeyMappingChange={handlers.handleMappingsChange}
              onManualPrivateKeyChange={handlers.handleManualPrivateKeyChange}
              onProjectChange={handlers.handleProjectChange}
              privateKeyLoading={privateKeyLoading}
              projectPrivateKey={projectPrivateKey}
              selectedProject={formState.selectedProject}
            />
          ) : (
            <ProjectEnvironmentInput
              isMultiEnvironment={config.maxEnvironmentsCount === 'any'}
              manualPrivateKey={formState.manualPrivateKey}
              onEnvironmentChange={handlers.handleEnvironmentChange}
              onManualPrivateKeyChange={handlers.handleManualPrivateKeyChange}
              onProjectChange={handlers.handleProjectChange}
              privateKeyLoading={privateKeyLoading}
              privateKeyRequired={config.isPrivateKeyRequired}
              projectPrivateKey={projectPrivateKey}
              selectedProject={formState.selectedProject}
            />
          )}
        </form>

        <AlertDialogFooter className="flex justify-between">
          <Button
            className="flex items-center gap-2"
            onClick={handlers.handlePreviousStep}
            variant="outline"
          >
            <ChevronLeft size={16} />
            Back
          </Button>

          <div className="flex gap-2">
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={handleSubmit}>
              {isLoading ? 'Creating...' : 'Create Integration'}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
