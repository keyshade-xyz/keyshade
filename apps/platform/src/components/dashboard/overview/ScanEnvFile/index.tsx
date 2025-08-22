import React, { useEffect, useState, useMemo } from 'react'
import secretDetector from '@keyshade/secret-scan'
import { parse as parseDotenv } from 'dotenv'
import type { Project } from '@keyshade/schema'
import { SecretSVG, VariableSVG } from '@public/svg/dashboard'
import ImportConfiguration from '../ImportConfiguration'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

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
  const [isProceedModalOpen, setIsProceedModalOpen] = useState(false)

  const parsedContent = useMemo(() => parseDotenv(content), [content])
  const secretsAndVariables = useMemo(
    () => secretDetector.scanJsObject(parsedContent),
    [parsedContent]
  )

  const [selectedItems, setSelectedItems] = useState<
    Record<string, 'secret' | 'variable'>
  >({})

  const [proceedPayload, setProceedPayload] = useState<{
    secrets: Record<string, string>
    variables: Record<string, string>
  }>({ secrets: {}, variables: {} })

  const allItems = useMemo(
    () => ({
      ...secretsAndVariables.secrets,
      ...secretsAndVariables.variables
    }),
    [secretsAndVariables.secrets, secretsAndVariables.variables]
  )

  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [over, setOver] = useState<null | 'secret' | 'variable'>(null)

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingKey(key)
  }

  const handleDragEnd = () => setDraggingKey(null)

  const handleDragOver =
    (target: 'secret' | 'variable') => (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
      setOver(target)
    }

  const handleDrop =
    (target: 'secret' | 'variable') => (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const key = e.dataTransfer.getData('text/plain')
      if (!key || !(key in allItems)) return
      setSelectedItems((prev) =>
        prev[key] === target ? prev : { ...prev, [key]: target }
      )
      setOver(null)
      setDraggingKey(null)
    }

  const secretsList = useMemo(
    () =>
      Object.entries(selectedItems)
        .filter(([, type]) => type === 'secret')
        .map(([key]) => {
          return (
            <div
              className={`w-fit cursor-grab select-none rounded-md bg-neutral-800 p-2 text-xs text-white
                ${draggingKey === key ? 'opacity-60' : ''}`}
              draggable
              key={key}
              onDragEnd={handleDragEnd}
              onDragStart={(e) => handleDragStart(e, key)}
            >
              {key}
            </div>
          )
        }),
    [selectedItems, draggingKey]
  )

  const variablesList = useMemo(
    () =>
      Object.entries(selectedItems)
        .filter(([, type]) => type === 'variable')
        .map(([key]) => {
          return (
            <div
              className={`w-fit cursor-grab select-none rounded-md bg-neutral-800 p-2 text-xs text-white
                ${draggingKey === key ? 'opacity-60' : ''}`}
              draggable
              key={key}
              onDragEnd={handleDragEnd}
              onDragStart={(e) => handleDragStart(e, key)}
            >
              {key}
            </div>
          )
        }),
    [selectedItems, draggingKey]
  )

  const secretsCount = secretsList.length
  const variablesCount = variablesList.length

  const getTransformedSecretsAndVariables = () => {
    const transformedSecrets: Record<string, string> = {}
    const transformedVariables: Record<string, string> = {}

    Object.entries(selectedItems).forEach(([key, type]) => {
      const value = allItems[key]
      if (type === 'secret') {
        transformedSecrets[key] = value
      } else {
        transformedVariables[key] = value
      }
    })

    return {
      secrets: transformedSecrets,
      variables: transformedVariables
    }
  }

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

  useEffect(() => {
    const initialSelection: Record<string, 'secret' | 'variable'> = {}

    Object.keys(secretsAndVariables.secrets).forEach((key) => {
      initialSelection[key] = 'secret'
    })

    Object.keys(secretsAndVariables.variables).forEach((key) => {
      initialSelection[key] = 'variable'
    })

    setSelectedItems(initialSelection)
  }, [secretsAndVariables])

  const handleProceed = () => {
    const entries = getTransformedSecretsAndVariables()
    setProceedPayload(entries)

    onClose()
    setIsProceedModalOpen(true)
  }

  const handleEnvironmentSelect = (value: string) => {
    const environment = JSON.parse(value) as Environment
    setSelectedEnvironment(environment)
  }

  return (
    <>
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F]">
          <DialogHeader className="border-b border-white/20 pb-4">
            <DialogTitle className="text-xl font-semibold">
              Reorganize Selection
            </DialogTitle>
            <DialogDescription className="text-sm font-normal leading-5 text-gray-400">
              Reorganize secrets and variables before import.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1 border-b border-white/20">
            <div className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto  py-2">
              <div
                className={`flex flex-col gap-2 rounded-md border-2 bg-[#393A3B] p-2 text-sm text-white transition-colors ${
                  over === 'secret'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onDragEnter={handleDragOver('secret')}
                onDragLeave={(e) => {
                  if (
                    !(e.currentTarget as Node).contains(e.relatedTarget as Node)
                  )
                    setOver(null)
                }}
                onDragOver={handleDragOver('secret')}
                onDrop={handleDrop('secret')}
              >
                <div className="flex items-center gap-2">
                  <SecretSVG height={21} width={21} />
                  <p>{secretsCount} secrets to import</p>
                </div>
                <div className="ml-6 flex flex-wrap gap-1.5">{secretsList}</div>
              </div>
              <div
                className={`flex flex-col gap-2 rounded-md border-2 bg-[#393A3B] p-2 text-sm text-white transition-colors ${
                  over === 'variable'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onDragEnter={handleDragOver('variable')}
                onDragLeave={(e) => {
                  if (
                    !(e.currentTarget as Node).contains(e.relatedTarget as Node)
                  )
                    setOver(null)
                }}
                onDragOver={handleDragOver('variable')}
                onDrop={handleDrop('variable')}
              >
                <div className="flex items-center gap-2">
                  <VariableSVG height={21} width={21} />
                  <p>{variablesCount} variables to import</p>
                </div>
                <div className="ml-6 flex flex-wrap gap-1.5">
                  {variablesList}
                </div>
              </div>
            </div>
            <p className="pb-4 text-sm text-white/60">
              You&apos;re importing a total of{' '}
              <span className="font-semibold text-white/80">
                {secretsCount + variablesCount}
              </span>{' '}
              configuration items.
            </p>
          </div>

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
              Drag items to customize your selection, or proceed as is.
            </div>
            <div className="flex items-center justify-end">
              <Button
                disabled={!selectedEnvironment}
                onClick={handleProceed}
                variant="secondary"
              >
                Proceed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImportConfiguration
        environmentSlug={selectedEnvironment?.slug || ''}
        isOpen={isProceedModalOpen}
        onClose={() => setIsProceedModalOpen(false)}
        projectSlug={projectSlug}
        secretsAndVariables={proceedPayload}
      />
    </>
  )
}

export default ScanEnvModal
