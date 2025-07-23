import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
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
import {
  revisionsOfVariableAtom,
  rollbackVariableOpenAtom,
  variablesOfProjectAtom,
  selectedVariableAtom,
  selectedVariableEnvironmentAtom,
  selectedVariableRollbackVersionAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

export default function ConfirmRollbackVariable() {
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [isRollbackVariableOpen, setIsRollbackVariableOpen] = useAtom(
    rollbackVariableOpenAtom
  )
  const [selectedVariableEnvironment, setSelectedVariableEnvironment] = useAtom(
    selectedVariableEnvironmentAtom
  )
  const [selectedVariableRollbackVersion, setSelectedVariableRollbackVersion] =
    useAtom(selectedVariableRollbackVersionAtom)
  const setRevisionsOfVariable = useSetAtom(revisionsOfVariableAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const rollbackVariable = useHttp(() =>
    ControllerInstance.getInstance().variableController.rollbackVariable({
      environmentSlug: selectedVariableEnvironment!,
      version: selectedVariableRollbackVersion!,
      variableSlug: selectedVariable!.variable.slug
    })
  )

  const handleClose = useCallback(() => {
    setIsRollbackVariableOpen(false)
    setSelectedVariableEnvironment(null)
    setSelectedVariableRollbackVersion(null)
  }, [
    setIsRollbackVariableOpen,
    setSelectedVariableEnvironment,
    setSelectedVariableRollbackVersion
  ])

  const handleDeleteVariable = useCallback(async () => {
    if (
      selectedVariable &&
      selectedVariableEnvironment &&
      selectedVariableRollbackVersion
    ) {
      setIsLoading(true)
      toast.loading(
        `Rolling back to version ${selectedVariableRollbackVersion}...`
      )

      try {
        const { success, data } = await rollbackVariable()

        if (success && data) {
          toast.success('Variable rolled back successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                Your variable got rolled back to version{' '}
                <span className="font-semibold">
                  {selectedVariableRollbackVersion}
                </span>
                . {data.count} versions created after that have been removed.
              </p>
            )
          })

          // Remove the versions after the rollback version
          setRevisionsOfVariable((prev) =>
            prev.map((r) => {
              if (r.environment.slug === selectedVariableEnvironment) {
                r.versions = r.versions.filter(
                  (v) => v.version <= selectedVariableRollbackVersion
                )
              }
              return r
            })
          )

          setVariables((prev) =>
            prev.map((s) => {
              if (s.variable.slug === selectedVariable.variable.slug) {
                s.values = s.values.map((v) => {
                  if (v.environment.slug === selectedVariableEnvironment) {
                    return data.currentRevision
                  }
                  return v
                })
              }
              return s
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
    selectedVariable,
    selectedVariableEnvironment,
    selectedVariableRollbackVersion,
    rollbackVariable,
    setRevisionsOfVariable,
    setVariables,
    handleClose
  ])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isRollbackVariableOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isRollbackVariableOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isRollbackVariableOpen}
      onOpenChange={handleClose}
      open={isRollbackVariableOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to rollback to version{' '}
              {selectedVariableRollbackVersion}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete all the
            versions created after the selected version.
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
            onClick={handleDeleteVariable}
          >
            Yes, rollback to version {selectedVariableRollbackVersion}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
