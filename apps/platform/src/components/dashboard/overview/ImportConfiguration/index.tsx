import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CheckCircle, Loader2, X } from 'lucide-react'
import { useSetAtom } from 'jotai'
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

type ImportStep = 'importing' | 'complete'

interface ImportStatus {
  secretsImported: number
  variablesImported: number
  totalSecrets: number
  totalVariables: number
  currentStep: string
  errors: string[]
  isImporting: boolean
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
  const [step, setStep] = useState<ImportStep>('importing')
  const [selectedItems, setSelectedItems] = useState<
    Record<string, 'secret' | 'variable'>
  >({})
  const totalSecrets = Object.keys(secretsAndVariables.secrets).length
  const totalVariables = Object.keys(secretsAndVariables.variables).length
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    secretsImported: 0,
    variablesImported: 0,
    totalSecrets,
    totalVariables,
    currentStep: `Importing 0 of ${totalSecrets + totalVariables}`,
    errors: [],
    isImporting: true
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
    setImportStatus((prev) => ({ ...prev, isImporting: true }))

    const selectedSecrets: Record<string, string> = {}
    const selectedVariables: Record<string, string> = {}

    Object.entries(selectedItems).forEach(([key, type]) => {
      if (type === 'secret') {
        selectedSecrets[key] = allItems[key]
      } else {
        selectedVariables[key] = allItems[key]
      }
    })

    setImportStatus({
      secretsImported: 0,
      variablesImported: 0,
      totalSecrets,
      totalVariables,
      currentStep: `Importing 0 of ${totalSecrets + totalVariables}`,
      errors: [],
      isImporting: true
    })

    try {
      // Import secrets

      const secretEntries = Object.entries(selectedSecrets)
      const secretPromises = secretEntries.map(async ([key, value], i) => {
        const current = i + 1

        const { error, success } =
          await ControllerInstance.getInstance().secretController.createSecret({
            projectSlug,
            name: key,
            entries: [
              {
                value,
                environmentSlug
              }
            ]
          })

        setImportStatus((prev) => ({
          ...prev,
          secretsImported: current,
          currentStep: `Importing ${current} of ${totalSecrets + totalVariables}`
        }))

        if (!success) {
          setImportStatus((prev) => ({
            ...prev,
            errors: [
              ...prev.errors,
              `Failed to import secret "${key}": ${String(error)}`
            ]
          }))
        } else {
          setProjectSecretCount((prev) => prev + 1)
        }
      })
      await Promise.all(secretPromises)

      // Import variables

      const variableEntries = Object.entries(selectedVariables)
      const variablePromises = variableEntries.map(async ([key, value], i) => {
        const current = i + 1

        const { error, success } =
          await ControllerInstance.getInstance().variableController.createVariable(
            {
              projectSlug,
              name: key,
              entries: [
                {
                  value,
                  environmentSlug
                }
              ]
            }
          )

        setImportStatus((prev) => ({
          ...prev,
          variablesImported: current,
          currentStep: `Importing ${totalSecrets + current} of ${totalSecrets + totalVariables}`
        }))

        if (!success) {
          setImportStatus((prev) => ({
            ...prev,
            errors: [
              ...prev.errors,
              `Failed to import variable "${key}": ${String(error)}`
            ]
          }))
        } else {
          setProjectVariableCount((prev) => prev + 1)
        }
      })

      await Promise.all(variablePromises)

      setImportStatus((prev) => ({
        ...prev,
        isImporting: false,
        currentStep: `Imported all ${totalSecrets + totalVariables}`
      }))

      if (onImport) {
        await onImport({ selectedSecrets, selectedVariables })
      }

      setStep('complete')
    } catch (error) {
      setImportStatus((prev) => ({
        ...prev,
        currentStep: 'Import failed',
        isImporting: false,
        errors: [
          error instanceof Error ? error.message : 'Unknown error occurred'
        ]
      }))
    }
  }, [
    onImport,
    projectSlug,
    environmentSlug,
    selectedItems,
    allItems,
    totalSecrets,
    totalVariables,
    setProjectSecretCount,
    setProjectVariableCount
  ])

  useEffect(() => {
    if (isOpen) {
      handleImport()
    }
  }, [isOpen, handleImport])

  const handleClose = () => {
    setStep('importing')
    setImportStatus({
      secretsImported: 0,
      variablesImported: 0,
      totalSecrets,
      totalVariables,
      currentStep: `Importing 0 of ${totalSecrets + totalVariables}`,
      errors: [],
      isImporting: true
    })
    onClose()
  }

  const getProgressPercentage = () => {
    const total = totalSecrets + totalVariables
    const imported =
      importStatus.secretsImported + importStatus.variablesImported
    return total > 0 ? (imported / total) * 100 : 0
  }

  const renderImportingStep = () => (
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
              {totalSecrets + totalVariables}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-4 font-medium text-white">Import progress</h3>
        <div className="mb-6 h-2 w-full rounded-full bg-gray-700">
          <div
            className="h-2 rounded-full bg-white transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-4 font-medium text-white">Status</h3>
        <div className="space-y-3">
          {/* Secrets Row */}
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center">
              {importStatus.isImporting &&
              importStatus.secretsImported < totalSecrets ? (
                <div className="h-3 w-3 rounded-full bg-white" />
              ) : importStatus.secretsImported === totalSecrets ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
              )}
            </div>
            <span className="text-sm text-gray-300">
              {importStatus.secretsImported < totalSecrets
                ? importStatus.currentStep
                : `${importStatus.secretsImported} secrets imported`}
            </span>
          </div>

          {/* Variables Row */}
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center">
              {importStatus.isImporting &&
              importStatus.secretsImported === totalSecrets &&
              importStatus.variablesImported < totalVariables ? (
                <div className="h-3 w-3 rounded-full bg-white" />
              ) : importStatus.variablesImported === totalVariables ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
              )}
            </div>
            <span className="text-sm text-gray-300">
              {importStatus.variablesImported < totalVariables
                ? importStatus.currentStep
                : `${importStatus.variablesImported} variables imported`}
            </span>
          </div>

          {/* Overall Row */}
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center">
              {importStatus.secretsImported === totalSecrets &&
              importStatus.variablesImported === totalVariables ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
              )}
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

  const renderCompleteStep = () => (
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

      <h2 className="mb-4 text-xl font-semibold text-white">Import complete</h2>
      <p className="mb-6 text-gray-400 underline">
        We have finished importing your variables and secrets.
      </p>

      <div className="mb-6 text-sm text-gray-400">
        <div>
          Secrets imported:{' '}
          <span className="font-medium text-white">{totalSecrets}</span>,
          Variables imported:{' '}
          <span className="font-medium text-white">{totalVariables}</span>,
          Total imported:{' '}
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

  if (!isOpen) return <div />

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {step === 'importing' && renderImportingStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  )
}

export default ImportConfiguration
