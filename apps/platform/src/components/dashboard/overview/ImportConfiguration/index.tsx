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
  secretsFailed: number
  variablesFailed: number
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
    secretsFailed: 0,
    variablesFailed: 0,
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
      secretsFailed: 0,
      variablesFailed: 0,
      totalSecrets,
      totalVariables,
      currentStep: `Importing 0 of ${totalSecrets + totalVariables}`,
      errors: [],
      isImporting: true
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
      const totalEntries = secretEntries.length + variableEntries.length

      const errorMessages: string[] = []
      let processedCount = 0
      let successfulSecrets = 0
      let failedSecrets = 0
      let successfulVariables = 0
      let failedVariables = 0

      if (secretEntries.length > 0) {
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

        if (secretResponse.success && secretResponse.data) {
          successfulSecrets = secretResponse.data.successful.length
          failedSecrets = secretResponse.data.failed.length

          if (successfulSecrets > 0) {
            setProjectSecretCount((prev) => prev + successfulSecrets)
          }

          if (failedSecrets > 0) {
            errorMessages.push(
              ...secretResponse.data.failed.map(
                ({ name, error }) =>
                  `Failed to import secret "${name}": ${error}`
              )
            )
          }
        } else {
          failedSecrets = secretEntries.length
          errorMessages.push(
            `Failed to import secrets: ${
              secretResponse.error?.message ?? 'Unknown error occurred'
            }`
          )
        }

        processedCount += secretEntries.length

        setImportStatus((prev) => ({
          ...prev,
          secretsImported: successfulSecrets,
          secretsFailed: failedSecrets,
          currentStep: `Importing ${processedCount} of ${totalEntries}`,
          errors: [...errorMessages]
        }))
      }

      if (variableEntries.length > 0) {
        setImportStatus((prev) => ({
          ...prev,
          currentStep: 'Importing variables'
        }))

        const variableResponse =
          await ControllerInstance.getInstance().variableController.bulkCreateVariables(
            {
              projectSlug,
              variables: variableEntries
            }
          )

        if (variableResponse.success && variableResponse.data) {
          successfulVariables = variableResponse.data.successful.length
          failedVariables = variableResponse.data.failed.length

          if (successfulVariables > 0) {
            setProjectVariableCount((prev) => prev + successfulVariables)
          }

          if (failedVariables > 0) {
            errorMessages.push(
              ...variableResponse.data.failed.map(
                ({ name, error }) =>
                  `Failed to import variable "${name}": ${error}`
              )
            )
          }
        } else {
          failedVariables = variableEntries.length
          errorMessages.push(
            `Failed to import variables: ${
              variableResponse.error?.message ?? 'Unknown error occurred'
            }`
          )
        }

        processedCount += variableEntries.length

        setImportStatus((prev) => ({
          ...prev,
          variablesImported: successfulVariables,
          variablesFailed: failedVariables,
          currentStep: `Importing ${processedCount} of ${totalEntries}`,
          errors: [...errorMessages]
        }))
      }

      const totalSucceeded = successfulSecrets + successfulVariables
      const totalFailed = failedSecrets + failedVariables
      const finalStepMessage =
        totalFailed > 0
          ? `Imported ${totalSucceeded} of ${totalEntries} (${totalFailed} failed)`
          : `Imported all ${totalEntries}`

      setImportStatus((prev) => ({
        ...prev,
        isImporting: false,
        currentStep: finalStepMessage,
        errors: [...errorMessages]
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
          ...prev.errors,
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
      secretsFailed: 0,
      variablesFailed: 0,
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
    const processed =
      importStatus.secretsImported +
      importStatus.variablesImported +
      importStatus.secretsFailed +
      importStatus.variablesFailed
    return total > 0 ? (processed / total) * 100 : 0
  }

  const renderImportingStep = () => {
    const secretsProcessed =
      importStatus.secretsImported + importStatus.secretsFailed
    const variablesProcessed =
      importStatus.variablesImported + importStatus.variablesFailed
    const totalEntriesCount = totalSecrets + totalVariables
    const totalProcessed = secretsProcessed + variablesProcessed
    const hasFailures =
      importStatus.secretsFailed > 0 || importStatus.variablesFailed > 0

    const overallIcon = (() => {
      if (totalEntriesCount === 0) {
        return <CheckCircle className="h-5 w-5 text-green-400" />
      }

      if (
        totalProcessed === totalEntriesCount &&
        !importStatus.isImporting
      ) {
        return hasFailures ? (
          <X className="h-5 w-5 text-red-400" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-400" />
        )
      }

      return <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
    })()

    const secretsStatusText =
      secretsProcessed < totalSecrets
        ? `Importing secrets (${secretsProcessed} of ${totalSecrets})`
        : `${importStatus.secretsImported} secrets imported${
            importStatus.secretsFailed
              ? ` (${importStatus.secretsFailed} failed)`
              : ''
          }`

    const variablesStatusText =
      variablesProcessed < totalVariables
        ? `Importing variables (${variablesProcessed} of ${totalVariables})`
        : `${importStatus.variablesImported} variables imported${
            importStatus.variablesFailed
              ? ` (${importStatus.variablesFailed} failed)`
              : ''
          }`

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
              <span className="font-medium text-white">{totalEntriesCount}</span>
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
                {importStatus.isImporting && secretsProcessed < totalSecrets ? (
                  <div className="h-3 w-3 rounded-full bg-white" />
                ) : secretsProcessed === totalSecrets ? (
                  importStatus.secretsFailed > 0 ? (
                    <X className="h-5 w-5 text-red-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                )}
              </div>
              <span className="text-sm text-gray-300">{secretsStatusText}</span>
            </div>

            {/* Variables Row */}
            <div className="flex items-center space-x-3">
              <div className="flex h-5 w-5 items-center justify-center">
                {importStatus.isImporting &&
                secretsProcessed === totalSecrets &&
                variablesProcessed < totalVariables ? (
                  <div className="h-3 w-3 rounded-full bg-white" />
                ) : variablesProcessed === totalVariables ? (
                  importStatus.variablesFailed > 0 ? (
                    <X className="h-5 w-5 text-red-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                )}
              </div>
              <span className="text-sm text-gray-300">
                {variablesStatusText}
              </span>
            </div>

            {/* Overall Row */}
            <div className="flex items-center space-x-3">
              <div className="flex h-5 w-5 items-center justify-center">
                {overallIcon}
              </div>
              <span className="text-sm text-gray-300">
                {importStatus.currentStep}
              </span>
            </div>
          </div>
          {importStatus.errors.length > 0 && (
            <div className="mt-4 rounded-md bg-red-500/10 p-3">
              <p className="mb-2 text-sm font-medium text-red-300">
                Issues detected
              </p>
              <ul className="space-y-1 text-xs text-red-400">
                {importStatus.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
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
    const totalImported =
      importStatus.secretsImported + importStatus.variablesImported
    const totalFailed =
      importStatus.secretsFailed + importStatus.variablesFailed

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
            <span className="font-medium text-white">
              {importStatus.secretsImported}
            </span>
            , Variables imported:{' '}
            <span className="font-medium text-white">
              {importStatus.variablesImported}
            </span>
            , Total imported:{' '}
            <span className="font-medium text-white">{totalImported}</span>
          </div>
          {totalFailed > 0 && (
            <div className="mt-2 text-red-400">
              Failed imports:{' '}
              <span className="font-medium text-red-300">{totalFailed}</span>
            </div>
          )}
        </div>

        {importStatus.errors.length > 0 && (
          <div className="mx-auto mb-6 max-h-32 overflow-y-auto rounded-md bg-red-500/10 p-3 text-left">
            <p className="mb-2 text-sm font-medium text-red-300">
              Issues detected
            </p>
            <ul className="space-y-1 text-xs text-red-400">
              {importStatus.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={handleClose} variant="secondary">
          Go to project overview
        </Button>
      </div>
    )
  }

  if (!isOpen) return <div />

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {step === 'importing' && renderImportingStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  )
}

export default ImportConfiguration
