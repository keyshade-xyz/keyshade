import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CheckCircle, Loader2, X } from 'lucide-react'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import ControllerInstance from '@/lib/controller-instance'
import { projectSecretCountAtom, projectVariableCountAtom } from '@/store'

interface ImportConfigurationProps {
  isOpen: boolean
  onClose: () => void
  secretsAndVariables: {
    secrets: Record<string, string>
    variables: Record<string, string>
  }
  environmentSlug: string
  projectSlug: string
  onImport?: (config: ImportConfig) => Promise<void>
}

interface ImportConfig {
  selectedSecrets: Record<string, string>
  selectedVariables: Record<string, string>
}

interface ImportStatus {
  currentStep: string
  isImporting: boolean
  secretsDone: boolean
  variablesDone: boolean
}

function ImportConfiguration({
  isOpen,
  onClose,
  secretsAndVariables,
  environmentSlug,
  projectSlug,
  onImport
}: ImportConfigurationProps): React.JSX.Element {
  const setProjectSecretCount = useSetAtom(projectSecretCountAtom)
  const setProjectVariableCount = useSetAtom(projectVariableCountAtom)
  const [selectedItems, setSelectedItems] = useState<
    Record<string, 'secret' | 'variable'>
  >({})
  const totalSecrets = Object.keys(secretsAndVariables.secrets).length
  const totalVariables = Object.keys(secretsAndVariables.variables).length
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    currentStep: 'Preparing import',
    isImporting: true,
    secretsDone: false,
    variablesDone: false
  })

  // Memoize allItems to prevent recreation on every render
  const allItems = useMemo(
    () => ({
      ...secretsAndVariables.secrets,
      ...secretsAndVariables.variables
    }),
    [secretsAndVariables.secrets, secretsAndVariables.variables]
  )

  // Initialize selected items based on detected classification
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

  const handleImport = useCallback(async () => {
    setImportStatus((prev) => ({
      ...prev,
      isImporting: true,
      currentStep: 'Preparing import',
      secretsDone: false,
      variablesDone: false
    }))

    const selectedSecrets: Record<string, string> = {}
    const selectedVariables: Record<string, string> = {}

    Object.entries(selectedItems).forEach(([key, type]) => {
      if (type === 'secret') {
        selectedSecrets[key] = allItems[key]
      } else {
        selectedVariables[key] = allItems[key]
      }
    })

    try {
      const secretEntries = Object.entries(selectedSecrets).map(
        ([name, value]) => ({
          name,
          value,
          environmentSlug
        })
      )
      const variableEntries = Object.entries(selectedVariables).map(
        ([name, value]) => ({
          name,
          value,
          environmentSlug
        })
      )
      const hasSecrets = secretEntries.length > 0
      const hasVariables = variableEntries.length > 0

      if (hasSecrets) {
        setImportStatus((prev) => ({
          ...prev,
          currentStep: 'Importing secrets'
        }))

        const secretResponse =
          await ControllerInstance.getInstance().secretController.bulkCreateSecrets(
            {
              projectSlug,
              secrets: secretEntries
            }
          )

        if (!secretResponse.success) {
          const message =
            secretResponse.error?.message ?? 'Failed to import secrets'
          toast.error(message)
          setImportStatus((prev) => ({
            ...prev,
            isImporting: false,
            currentStep: 'Import failed'
          }))
          return
        }

        setProjectSecretCount((prev) => prev + secretEntries.length)
        setImportStatus((prev) => ({
          ...prev,
          secretsDone: true,
          currentStep: hasVariables ? 'Importing variables' : 'Import complete'
        }))
      }

      if (hasVariables) {
        const variableResponse =
          await ControllerInstance.getInstance().variableController.bulkCreateVariables(
            {
              projectSlug,
              variables: variableEntries
            }
          )

        if (!variableResponse.success) {
          const message =
            variableResponse.error?.message ?? 'Failed to import variables'
          toast.error(message)
          setImportStatus((prev) => ({
            ...prev,
            isImporting: false,
            currentStep: 'Import failed'
          }))
          return
        }

        setProjectVariableCount((prev) => prev + variableEntries.length)
        setImportStatus((prev) => ({
          ...prev,
          variablesDone: true,
          currentStep: 'Import complete'
        }))
      }

      setImportStatus((prev) => ({
        ...prev,
        isImporting: false,
        currentStep: 'Import complete'
      }))

      if (onImport) {
        await onImport({ selectedSecrets, selectedVariables })
      }
    } catch (error) {
      toast.error('Failed to import configurations')
      setImportStatus((prev) => ({
        ...prev,
        currentStep: 'Import failed',
        isImporting: false
      }))
    }
  }, [
    onImport,
    projectSlug,
    environmentSlug,
    selectedItems,
    allItems,
    setProjectSecretCount,
    setProjectVariableCount
  ])

  useEffect(() => {
    if (isOpen) {
      handleImport()
    }
  }, [isOpen, handleImport])

  const handleClose = () => {
    setImportStatus({
      currentStep: 'Preparing import',
      isImporting: true,
      secretsDone: false,
      variablesDone: false
    })
    onClose()
  }

  const renderImportingStep = () => {
    const overallIcon = importStatus.isImporting ? (
      <Loader2 className="h-5 w-5 animate-spin text-white" />
    ) : importStatus.currentStep === 'Import complete' ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <X className="h-5 w-5 text-red-400" />
    )

    return (
      <div className="relative mx-auto w-[450px] rounded-lg bg-[#1a1a1a] p-6">
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
          onClick={handleClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Import Configurations
          </h2>
          <p className="text-sm text-gray-400">
            Reorganize secrets and variables before import.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 font-medium text-white">Import summary</h3>
          <div className="space-y-1 text-sm">
            <div className="text-gray-400">
              Secrets to import:{' '}
              <span className="font-medium text-white">{totalSecrets}</span>
            </div>
            <div className="text-gray-400">
              Variables to import:{' '}
              <span className="font-medium text-white">{totalVariables}</span>
            </div>
            <div className="text-gray-400">
              Total entries:{' '}
              <span className="font-medium text-white">
                {totalEntriesCount}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-4 font-medium text-white">Status</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-5 w-5 items-center justify-center">
                {importStatus.secretsDone ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm text-gray-300">
                {importStatus.secretsDone ? 'Secrets imported' : 'Importing secrets'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex h-5 w-5 items-center justify-center">
                {importStatus.variablesDone ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm text-gray-300">
                {importStatus.variablesDone
                  ? 'Variables imported'
                  : importStatus.secretsDone
                    ? 'Importing variables'
                    : 'Waiting to import variables'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex h-5 w-5 items-center justify-center">
                {overallIcon}
              </div>
              <span className="text-sm text-gray-300">
                {importStatus.currentStep}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button disabled variant="secondary">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {importStatus.isImporting ? 'Importing' : 'Importing'}
          </Button>
        </div>
      </div>
    )
  }

  const renderCompleteStep = () => {
    return (
      <div className="relative mx-auto w-[450px] rounded-lg bg-[#1a1a1a] p-6 text-center">
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
          onClick={handleClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">
          Import complete
        </h2>
        <p className="mb-6 text-gray-400 underline">
          We have finished importing your variables and secrets.
        </p>

        <div className="mb-6 text-sm text-gray-400">
          <div>
            Secrets imported:{' '}
            <span className="font-medium text-white">{totalSecrets}</span>
            , Variables imported:{' '}
            <span className="font-medium text-white">{totalVariables}</span>
            , Total imported:{' '}
            <span className="font-medium text-white">
              {totalSecrets + totalVariables}
            </span>
          </div>
        </div>

        <Button onClick={handleClose} variant="secondary">
          Go to project overview
        </Button>
      </div>
    )
  }

  if (!isOpen) return <div />

  const isComplete =
    !importStatus.isImporting && importStatus.currentStep === 'Import complete'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {!isComplete && renderImportingStep()}
      {isComplete ? renderCompleteStep() : null}
    </div>
  )
}

export default ImportConfiguration
