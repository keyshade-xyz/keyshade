import React, { useEffect, useState } from 'react'
import ImportConfiguration from '../ImportConfiguration'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface ModifyFileScanProps {
  isOpen: boolean
  onClose: () => void
  secretsAndVariables: {
    secrets: Record<string, string>
    variables: Record<string, string>
  }
  environmentSlug: string
  projectSlug: string
}

function ModifyFileScan({
  isOpen,
  onClose,
  secretsAndVariables,
  environmentSlug,
  projectSlug
}: ModifyFileScanProps): React.JSX.Element {
  const allItems = {
    ...secretsAndVariables.secrets,
    ...secretsAndVariables.variables
  }
  const [selectedItems, setSelectedItems] = useState<
    Record<string, 'secret' | 'variable'>
  >({})
  const [proceedPayload, setProceedPayload] = useState<{
    secrets: Record<string, string>
    variables: Record<string, string>
  }>({ secrets: {}, variables: {} })
  const [isProceedModalOpen, setIsProceedModalOpen] = useState(false)

  const handleItemToggle = (key: string, type: 'secret' | 'variable') => {
    setSelectedItems((prev) => ({
      ...prev,
      [key]: type
    }))
  }

  const handleNext = () => {
    const entries = getTransformedSecretsAndVariables()
    setProceedPayload(entries)

    onClose()
    setIsProceedModalOpen(true)
  }

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

  return (
    <>
      <AlertDialog onOpenChange={onClose} open={isOpen}>
        <AlertDialogContent className="max-w-2xl rounded-lg border border-white/25 bg-[#1E1E1F]">
          <AlertDialogHeader className="border-b border-white/20 pb-4">
            <AlertDialogTitle className="text-xl font-semibold">
              Configure Import
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
              Select whether each item should be imported as a secret or
              variable.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-4">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-sm text-white/60">
                Selected Environment:{' '}
                <span className="font-medium text-white">
                  {environmentSlug}
                </span>
              </p>
            </div>
            <div className="space-y-4">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-white/20 p-3">
                {Object.entries(allItems).map(([key, value]) => (
                  <div
                    className="flex items-center justify-between rounded bg-white/5 p-2"
                    key={key}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{key}</div>
                      <div className="truncate text-sm text-gray-400">
                        {value}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={selectedItems[key] === 'secret'}
                          className="border-white/20 bg-white/10 "
                          onCheckedChange={() =>
                            handleItemToggle(key, 'secret')
                          }
                        />
                        <span className="text-sm">Secret</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={selectedItems[key] === 'variable'}
                          className="border-white/20 bg-white/10 "
                          onCheckedChange={() =>
                            handleItemToggle(key, 'variable')
                          }
                        />
                        <span className="text-sm">Variable</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <Button onClick={onClose} variant="default">
              Cancel
            </Button>
            <Button onClick={handleNext} variant="secondary">
              Next
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportConfiguration
        environmentSlug={environmentSlug}
        isOpen={isProceedModalOpen}
        onClose={() => setIsProceedModalOpen(false)}
        projectSlug={projectSlug}
        secretsAndVariables={proceedPayload}
      />
    </>
  )
}
export default ModifyFileScan
