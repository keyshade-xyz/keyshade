'use client'

import React, { useCallback, useEffect } from 'react'
import { TrashSVG } from '@public/svg/shared'
import { toast } from 'sonner'
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
import { Variable } from '@keyshade/schema'

export default function ConfirmDeleteVariable({
  isOpen,
  onClose,
  variable
}: {
  isOpen: boolean
  onClose: () => void
  variable: Variable
}) {
  const deleteVariable = async () => {
    if (variableSlug === null) {
      return
    }

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
    }
    if (error) {
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    }

    onClose()
  }

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isOpen, cleanup])

  return (
    <AlertDialog aria-hidden={!isOpen} onOpenChange={onClose} open={isOpen}>
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
            onClick={() => onClose()}
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
