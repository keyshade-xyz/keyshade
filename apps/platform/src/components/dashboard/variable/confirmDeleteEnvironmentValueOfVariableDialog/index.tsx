import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { TrashSVG } from '@public/svg/shared'
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
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import {
  deleteEnvironmentValueOfVariableOpenAtom,
  selectedVariableAtom,
  selectedVariableEnvironmentAtom,
  variablesOfProjectAtom
} from '@/store'

export default function ConfirmDeleteEnvironmentValueOfVariableDialog(): React.JSX.Element {
  const [
    isDeleteEnvironmentValueOfVariableOpen,
    setIsDeleteEnvironmentValueOfVariableOpen
  ] = useAtom(deleteEnvironmentValueOfVariableOpenAtom)
  const [selectedVariable, setSelectedVariable] = useAtom(selectedVariableAtom)
  const [selectedVariableEnvironment, setSelectedVariableEnvironment] = useAtom(
    selectedVariableEnvironmentAtom
  )
  const setVariablesOfProject = useSetAtom(variablesOfProjectAtom)

  const [isLoading, setIsLoading] = useState(false)

  const deleteEnvironmentValueOfVariable = useHttp(() =>
    ControllerInstance.getInstance().variableController.deleteEnvironmentValueOfVariable(
      {
        variableSlug: selectedVariable!.variable.slug,
        environmentSlug: selectedVariableEnvironment!
      }
    )
  )

  const handleClose = useCallback(() => {
    setIsDeleteEnvironmentValueOfVariableOpen(false)
    setSelectedVariable(null)
    setSelectedVariableEnvironment(null)
  }, [
    setIsDeleteEnvironmentValueOfVariableOpen,
    setSelectedVariable,
    setSelectedVariableEnvironment
  ])

  const handleDeleteEnvironmentValueOfVariable = useCallback(async () => {
    if (selectedVariable && selectedVariableEnvironment) {
      setIsLoading(true)
      toast.loading('Deleting environment value...')

      try {
        const { success } = await deleteEnvironmentValueOfVariable()

        if (success) {
          toast.success('Environment value deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The environment value has been deleted.
              </p>
            )
          })

          // Remove the environment value from the state
          setVariablesOfProject((prev) =>
            prev.map((variable) => {
              if (variable.variable.slug === selectedVariable.variable.slug) {
                return {
                  ...variable,
                  values: variable.values.filter(
                    (value) =>
                      value.environment.slug !== selectedVariableEnvironment
                  )
                }
              }
              return variable
            })
          )
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
        handleClose()
      }
    }
  }, [
    deleteEnvironmentValueOfVariable,
    handleClose,
    selectedVariable,
    selectedVariableEnvironment,
    setVariablesOfProject
  ])

  return (
    <AlertDialog
      aria-hidden={!isDeleteEnvironmentValueOfVariableOpen}
      onOpenChange={handleClose}
      open={isDeleteEnvironmentValueOfVariableOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete the value for this environment?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            current version of the variable in this environment, and all the
            previous versions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={isLoading}
            onClick={handleDeleteEnvironmentValueOfVariable}
          >
            Yes, delete the environment value
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
