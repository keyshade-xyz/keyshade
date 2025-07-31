'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
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
import ControllerInstance from '@/lib/controller-instance'
import {
  deleteVariableOpenAtom,
  projectVariableCountAtom,
  selectedVariableAtom,
  variablesOfProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'

export default function ConfirmDeleteVariable() {
  const [selectedVariable, setSelectedVariable] = useAtom(selectedVariableAtom)
  const [isDeleteVariableOpen, setIsDeleteVariableOpen] = useAtom(
    deleteVariableOpenAtom
  )
  const setVariables = useSetAtom(variablesOfProjectAtom)
  const setProjectVariableCount = useSetAtom(projectVariableCountAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const deleteVariable = useHttp(() =>
    ControllerInstance.getInstance().variableController.deleteVariable({
      variableSlug: selectedVariable!.slug
    })
  )

  const handleClose = useCallback(() => {
    setIsDeleteVariableOpen(false)
  }, [setIsDeleteVariableOpen])

  const handleDeleteVariable = useCallback(async () => {
    if (selectedVariable) {
      const { success } = await deleteVariable()

      setIsLoading(true)
      toast.loading('Deleting variable...')

      try {
        if (success) {
          setProjectVariableCount((prevCount) => prevCount - 1)
          toast.success('Variable deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The variable has been deleted.
              </p>
            )
          })

          // Remove the variable from the store
          setVariables((prevVariables) =>
            prevVariables.filter(
              (variable) => variable.slug !== selectedVariable.slug
            )
          )
          setSelectedVariable(null)

          handleClose()
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedVariable,
    deleteVariable,
    setVariables,
    setSelectedVariable,
    handleClose,
    setProjectVariableCount
  ])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isDeleteVariableOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isDeleteVariableOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isDeleteVariableOpen}
      onOpenChange={handleClose}
      open={isDeleteVariableOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete this variable?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            variable and remove your variable data from our servers.
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
            Yes, delete the variable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
