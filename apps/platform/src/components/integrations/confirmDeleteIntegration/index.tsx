import React, { useCallback, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  deleteIntegrationOpenAtom,
  selectedIntegrationAtom,
  workspaceIntegrationCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function DeleteIntegrationDialog() {
  const [isDeleteIntegrationOpen, setIsDeleteIntegrationOpen] = useAtom(
    deleteIntegrationOpenAtom
  )
  const selectedIntegration = useAtomValue(selectedIntegrationAtom)
  const setWorkspaceIntegrationCount = useSetAtom(workspaceIntegrationCountAtom)
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCleanup, setConfirmCleanup] = useState(false)

  const deleteIntegration = useHttp((integrationSlug: string, cleanUp: boolean) => {
    return ControllerInstance.getInstance().integrationController.deleteIntegration(
      {
        integrationSlug,
        cleanUp
      }
    )
  })

  const handleDeleteIntegration = useCallback(async () => {
    if (!selectedIntegration || !confirmDelete) return
    try {
      const { success } = await deleteIntegration(selectedIntegration.slug, confirmCleanup);
      if (success) {
        setWorkspaceIntegrationCount((prev) => prev - 1)
        toast.success('Integration deleted successfully')
        router.push('/integrations?tab=all')
      }
    } catch (error) {
      toast.error('Error deleting integration')
    } finally {
      setIsDeleteIntegrationOpen(false)
      setConfirmDelete(false)
      setConfirmCleanup(false)
    }
  }, [
    setIsDeleteIntegrationOpen,
    deleteIntegration,
    selectedIntegration,
    confirmDelete,
<<<<<<< HEAD
    router,
    setWorkspaceIntegrationCount
=======
    confirmCleanup,
    router
>>>>>>> cc3c2870 (configured DeleteIntegrationDialog to send a cleanUp parameter to the delete integration endpoint)
  ])

  const handleClose = useCallback(() => {
    setIsDeleteIntegrationOpen(false)
    setConfirmDelete(false)
  }, [setIsDeleteIntegrationOpen])

  return (
    <Dialog
      aria-hidden={!isDeleteIntegrationOpen}
      onOpenChange={handleClose}
      open={isDeleteIntegrationOpen}
    >
      <DialogContent className="rounded-md border-transparent bg-[#18181B]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium">
            Delete an integration
          </DialogTitle>
          <DialogDescription className="text-sm font-normal leading-5 text-white/50">
            Remove any Keyshade-generated credentials or configurations (like
            private keys) from the integration platform when deleting this
            integration.
          </DialogDescription>
          <div className="flex gap-2 border-y-[0.5px] border-white/20 py-3">
            <Checkbox
              checked={confirmDelete}
              className="mt-1 h-5 w-5 rounded border-[0.2px] border-white/40 bg-[#242528] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
              id="confirm-delete-integration"
              onCheckedChange={(checked) => setConfirmDelete(Boolean(checked))}
            />

            <Label
              className="ml-2 flex w-3/4 flex-col"
              htmlFor="confirm-delete-integration"
            >
              <p className="text-lg">Delete &quot;{selectedIntegration?.slug}&quot;?</p>
              <p className="text-sm leading-5 text-white/50">
                This will completely remove all the integration runs, events, and data for this integration
                from your workspace.
              </p>
            </Label>
          </div>
          <div className="flex gap-2 border-b-[0.5px] border-white/20 py-3">
            <Checkbox
              checked={confirmCleanup}
              className="mt-1 h-5 w-5 rounded border-[0.2px] border-white/40 bg-[#242528] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
              id="confirm-cleanup"
              onCheckedChange={(checked) => setConfirmCleanup(Boolean(checked))}
            />

            <Label
              className="ml-2 flex w-3/4 flex-col"
              htmlFor="confirm-cleanup"
            >
              <p className="text-lg">Cleanup?</p>
              <p className="text-sm leading-5 text-white/50">
                Clean up all integration data.
              </p>
            </Label>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={!confirmDelete}
            onClick={handleDeleteIntegration}
            variant="destructive"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
