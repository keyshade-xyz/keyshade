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
  deleteEnvironmentOpenAtom,
  selectedEnvironmentAtom,
  environmentsOfProjectAtom,
  projectEnvironmentCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'

export default function ConfirmDeleteEnvironment(): React.JSX.Element {
  const [selectedEnvironment, setSelectedEnvironment] = useAtom(
    selectedEnvironmentAtom
  )
  const [isDeleteEnvironmentOpen, setIsDeleteEnvironmentOpen] = useAtom(
    deleteEnvironmentOpenAtom
  )
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)
  const setProjectEnvironmentCount = useSetAtom(projectEnvironmentCountAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const deleteEnvironment = useHttp(() =>
    ControllerInstance.getInstance().environmentController.deleteEnvironment({
      slug: selectedEnvironment!.slug
    })
  )

  const handleClose = useCallback(() => {
    setIsDeleteEnvironmentOpen(false)
  }, [setIsDeleteEnvironmentOpen])

  const handleDeleteEnvironment = useCallback(async () => {
    if (selectedEnvironment) {
      setIsLoading(true)
      toast.loading('Deleting environment...')

      try {
        const { success } = await deleteEnvironment()

        if (success) {
          setProjectEnvironmentCount((prevCount) => prevCount - 1)
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
              (environment) => environment.slug !== selectedEnvironment.slug
            )
          )

          // Set the selected environment to null
          setSelectedEnvironment(null)

          handleClose()
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedEnvironment,
    deleteEnvironment,
    setEnvironments,
    setSelectedEnvironment,
    handleClose,
    setProjectEnvironmentCount
  ])

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
            disabled={isLoading}
            onClick={handleDeleteEnvironment}
          >
            Yes, delete the environment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
