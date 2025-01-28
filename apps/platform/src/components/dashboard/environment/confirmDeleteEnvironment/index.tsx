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
  deleteEnvironmentOpenAtom,
  selectedEnvironmentAtom,
  environmentsOfProjectAtom
} from '@/store'

export default function ConfirmDeleteEnvironment(): React.JSX.Element {
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)
  const [isDeleteEnvironmentOpen, setIsDeleteEnvironmentOpen] = useAtom(
    deleteEnvironmentOpenAtom
  )
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)

  const handleClose = useCallback(() => {
    setIsDeleteEnvironmentOpen(false)
  }, [setIsDeleteEnvironmentOpen])

  const deleteEnvironment = useCallback(async () => {
    if (selectedEnvironment === null) {
      toast.error('No environment selected', {
        description: (
          <p className="text-xs text-red-300">
            No environment selected. Please select a environment.
          </p>
        )
      })
      return
    }

    const environmentSlug = selectedEnvironment.slug

    const { success, error } =
      await ControllerInstance.getInstance().environmentController.deleteEnvironment(
        { slug: environmentSlug },
        {}
      )

    if (success) {
      toast.success('Environment deleted successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            The environment has been deleted.
          </p>
        )
      })

      // Remove the environment from the store
      setEnvironments((prevEnvironments) =>
        prevEnvironments.filter(
          (environment) => environment.slug !== environmentSlug
        )
      )
    }
    if (error) {
      toast.error('Something went wrong!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while deleting the environment. Check console
            for more info.
          </p>
        )
      })
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    }

    handleClose()
  }, [setEnvironments, selectedEnvironment, handleClose])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isDeleteEnvironmentOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isDeleteEnvironmentOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isDeleteEnvironmentOpen}
      onOpenChange={handleClose}
      open={isDeleteEnvironmentOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete this environment?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            environment and remove your environment data from our servers.
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
            onClick={deleteEnvironment}
          >
            Yes, delete the environment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
