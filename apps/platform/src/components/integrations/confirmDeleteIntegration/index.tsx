import React, { useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
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
import { deleteIntegrationOpenAtom, selectedIntegrationAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

export default function DeleteIntegrationDialog() {
  const [isDeleteIntegrationOpen, setIsDeleteIntegrationOpen] = useAtom(
    deleteIntegrationOpenAtom
  )
  const selectedIntegration = useAtomValue(selectedIntegrationAtom)

  const deleteIntegration = useHttp((integrationSlug: string) => {
    return ControllerInstance.getInstance().integrationController.deleteIntegration(
      {
        integrationSlug
      }
    )
  })

  const handleDeleteIntegration = useCallback(async () => {
    if (!selectedIntegration) return
    try {
      const { success } = await deleteIntegration(selectedIntegration.slug)
      if (success) {
        toast.success('Integration deleted successfully')
        setIsDeleteIntegrationOpen(false)
      }
    } catch (error) {
      toast.error('Error deleting integration')
    }
    setIsDeleteIntegrationOpen(false)
  }, [setIsDeleteIntegrationOpen, deleteIntegration, selectedIntegration])

  const handleClose = useCallback(() => {
    setIsDeleteIntegrationOpen(false)
  }, [setIsDeleteIntegrationOpen])

  return (
    <AlertDialog
      aria-hidden={!isDeleteIntegrationOpen}
      onOpenChange={handleClose}
      open={isDeleteIntegrationOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete{' '}
              <span>{selectedIntegration?.name}</span> integration?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            integration.
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
            onClick={handleDeleteIntegration}
          >
            Yes, delete Integration
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
