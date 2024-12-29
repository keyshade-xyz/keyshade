'use client'

import React, { useCallback, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TrashSVG } from '@public/svg/shared'
import ControllerInstance from '@/lib/controller-instance'
import { toast } from 'sonner'

function ConfirmDelete({
  isOpen,
  onClose,
  variableSlug
}: {
  isOpen: boolean;
  onClose: () => void;
  variableSlug: string | null;
}) {

  const deleteVariable = async () => {

    if( variableSlug === null ){
      return
    }

    const { success, error } = await ControllerInstance.getInstance().variableController.deleteVariable(
      {variableSlug: variableSlug},
      {}
    )
    
    if (success) {
      toast.success('Variable deleted successfully', {
        // eslint-disable-next-line react/no-unstable-nested-components -- we need to nest the description
        description: () => (
          <p className="text-xs text-emerald-300">
            The variable has been deleted.
          </p>
        )
      })
    }
    if( error ){
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
    if (!open) {
      cleanup()
    }
    return () => cleanup()
  }, [open, cleanup])

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose} aria-hidden={!isOpen}>
      <AlertDialogContent className='bg-[#18181B] border border-white/25 rounded-lg '>
        <AlertDialogHeader >
            <div className='flex items-center gap-x-3'>
              <TrashSVG />
              <AlertDialogTitle className='text-lg font-semibold'>
                  Do you really want to delete this variable?
              </AlertDialogTitle>
            </div>
          <AlertDialogDescription className='text-sm font-normal leading-5 text-[#71717A]'>
            This action cannot be undone. This will permanently delete your variable and remove your variable data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className='bg-[#F4F4F5] text-black rounded-md hover:bg-[#F4F4F5]/80 hover:text-black'
            onClick={() => onClose()}
            >
            Cancel
            </AlertDialogCancel>
          <AlertDialogAction 
            className='bg-[#DC2626] text-white rounded-md hover:bg-[#DC2626]/80'
            onClick={deleteVariable}
            >
            Yes, delete the variable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDelete
