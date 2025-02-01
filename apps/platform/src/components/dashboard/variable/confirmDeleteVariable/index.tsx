'use client'

import React, { useCallback, useEffect } from 'react'
import { TrashSVG } from '@public/svg/shared'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
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
  selectedVariableAtom,
  variablesOfProjectAtom
} from '@/store'

export default function ConfirmDeleteVariable() {
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [isDeleteVariableOpen, setIsDeleteVariableOpen] = useAtom(
    deleteVariableOpenAtom
  )
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const handleClose = useCallback(() => {
    setIsDeleteVariableOpen(false)
  }, [setIsDeleteVariableOpen])

  const deleteVariable = useCallback(async () => {
    if (selectedVariable === null) {
      toast.error('No variable selected', {
        description: (
          <p className="text-xs text-red-300">
            No variable selected. Please select a variable.
          </p>
        )
      })
      return
    }

    const variableSlug = selectedVariable.variable.slug

    const { success, error } =
      await ControllerInstance.getInstance().variableController.deleteVariable(
        { variableSlug },
        {}
      )

    if (success) {
      toast.success('Variable deleted successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            The variable has been deleted.
          </p>
        )
      })

      // Remove the variable from the store
      setVariables((prevVariables) =>
        prevVariables.filter(({ variable }) => variable.slug !== variableSlug)
      )
      handleClose()
    } else {
      throw new Error(JSON.stringify(error))
    }
  }, [setVariables, selectedVariable, handleClose])

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
            onClick={deleteVariable}
          >
            Yes, delete the variable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
