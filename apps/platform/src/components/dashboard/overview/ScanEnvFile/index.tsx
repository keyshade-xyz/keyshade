import React, { useEffect, useState } from 'react'
import { SecretSVG, VariableSVG } from '@public/svg/dashboard'
import secretDetector from '@keyshade/secret-scan'
import { parse as parseDotenv } from 'dotenv'
import type { Project } from '@keyshade/schema'
import ImportConfiguration from '../ImportConfiguration'
import ModifyFileScan from '../ModifyFileScan'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface Environment {
  id: string
  name: string
  slug: string
}

interface ScanEnvModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  projectSlug: Project['slug']
}

function ScanEnvModal({
  projectSlug,
  isOpen,
  onClose,
  content
}: ScanEnvModalProps): React.JSX.Element {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<Environment | null>(null)
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false)
  const [isProceedModalOpen, setIsProceedModalOpen] = useState(false)

  const parsedContent = parseDotenv(content)
  const secretAndVariables = secretDetector.scanJsObject(parsedContent)

  const secretsCount = Object.keys(secretAndVariables.secrets).length
  const variablesCount = Object.keys(secretAndVariables.variables).length

  const secretsList = Object.entries(secretAndVariables.secrets).map(
    ([key]) => {
      return (
        <div
          className="w-fit rounded-md bg-neutral-800 p-2 text-xs text-white"
          key={key}
        >
          {key}
        </div>
      )
    }
  )

  const variablesList = Object.entries(secretAndVariables.variables).map(
    ([key]) => {
      return (
        <div
          className="w-fit rounded-md bg-neutral-800 p-2 text-xs text-white"
          key={key}
        >
          {key}
        </div>
      )
    }
  )

  const getProjectEnvironment = useHttp((slug: string) =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: slug
      }
    )
  )

  useEffect(() => {
    const fetchEnvironments = async () => {
      await getProjectEnvironment(projectSlug).then(({ data, success }) => {
        if (success && data?.items) {
          const envList = data.items.map((env: Environment) => ({
            id: env.id,
            name: env.name,
            slug: env.slug
          }))
          setEnvironments(envList)
        }
      })
    }
    fetchEnvironments()
  }, [projectSlug, getProjectEnvironment])

  const handleModify = () => {
    setIsModifyModalOpen(true)
    onClose()
  }
  const handleProceed = () => {
    setIsProceedModalOpen(true)
    onClose()
  }

  const handleEnvironmentSelect = (value: string) => {
    const environment = JSON.parse(value) as Environment
    setSelectedEnvironment(environment)
  }

  return (
    <>
      <AlertDialog onOpenChange={onClose} open={isOpen}>
        <AlertDialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F]">
          <AlertDialogHeader className="border-b border-white/20 pb-4">
            <AlertDialogTitle className="text-xl font-semibold">
              Reorganize Selection
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
              Reorganize secrets and variables before import.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto border-b border-white/20 py-2">
            <div className="flex flex-col gap-2 rounded-md bg-[#393A3B] p-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <SecretSVG height={21} width={21} />
                <p>{secretsCount} secrets to import</p>
              </div>
              <div className="ml-6 flex flex-wrap gap-1.5">{secretsList}</div>
            </div>
            <div className="flex flex-col gap-2 rounded-md bg-[#393A3B] p-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <VariableSVG height={21} width={21} />
                <p>{variablesCount} variables to import</p>
              </div>
              <div className="ml-6 flex flex-wrap gap-1.5">{variablesList}</div>
            </div>
          </div>

          <p className="text-sm text-white/60">
            You&apos;re importing a total of {secretsCount + variablesCount}{' '}
            configuration items.
          </p>

          <div className="flex flex-col gap-y-2 border-b border-white/20 pb-4 pt-3">
            <label
              className="font-medium text-white"
              htmlFor="environment-select"
            >
              Select Environment
            </label>
            <Select
              onValueChange={handleEnvironmentSelect}
              value={
                selectedEnvironment ? JSON.stringify(selectedEnvironment) : ''
              }
            >
              <SelectTrigger
                className="h-fit w-full rounded-[0.375rem] bg-[#393A3B]"
                id="environment-select"
              >
                <SelectValue placeholder="Select environment">
                  {selectedEnvironment?.name || 'Select environment'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-[0.013rem] border-white/10 bg-[#393A3B] text-white">
                {environments.length > 0 ? (
                  environments.map((environment) => (
                    <SelectItem
                      className="hover:bg-[#393A3B]/80"
                      key={environment.id}
                      value={JSON.stringify(environment)}
                    >
                      {environment.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-yellow-600">
                    No environments available in this project.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-sm text-white/60">
              Would you like to proceed with this selection or modify it
              manually?
            </div>
            <div className="flex items-center justify-between">
              <Button
                disabled={!selectedEnvironment}
                onClick={handleModify}
                variant="secondary"
              >
                Modify
              </Button>

              <Button
                disabled={!selectedEnvironment}
                onClick={handleProceed}
                variant="secondary"
              >
                Proceed
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <ModifyFileScan
        environmentSlug={selectedEnvironment?.slug || ''}
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        projectSlug={projectSlug}
        secretsAndVariables={secretAndVariables}
      />
      <ImportConfiguration
        environmentSlug={selectedEnvironment?.slug || ''}
        isOpen={isProceedModalOpen}
        onClose={() => setIsProceedModalOpen(false)}
        projectSlug={projectSlug}
        secretsAndVariables={secretAndVariables}
      />
    </>
  )
}

export default ScanEnvModal
