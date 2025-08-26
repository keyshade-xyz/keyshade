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
  const [confirmed, setConfirmed] = useState(false)

  const deleteIntegration = useHttp((integrationSlug: string) => {
    return ControllerInstance.getInstance().integrationController.deleteIntegration(
      {
        integrationSlug
      }
    )
  })

  const handleDeleteIntegration = useCallback(async () => {
    if (!selectedIntegration || !confirmed) return
    try {
      const { success } = await deleteIntegration(selectedIntegration.slug)
      if (success) {
        setWorkspaceIntegrationCount((prev) => prev - 1)
        toast.success('Integration deleted successfully')
        router.push('/integrations?tab=all')
      }
    } catch (error) {
      toast.error('Error deleting integration')
    } finally {
      setIsDeleteIntegrationOpen(false)
      setConfirmed(false)
    }
  }, [
    setIsDeleteIntegrationOpen,
    deleteIntegration,
    selectedIntegration,
    confirmed,
    router,
    setWorkspaceIntegrationCount
  ])

  const handleClose = useCallback(() => {
    setIsDeleteIntegrationOpen(false)
    setConfirmed(false)
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
              checked={confirmed}
              className="mt-1 h-5 w-5 rounded border-[0.2px] border-white/40 bg-[#242528] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
              id="confirm-delete-integration"
              onCheckedChange={(checked) => setConfirmed(Boolean(checked))}
            />

            <Label
              className="ml-2 flex w-3/4 flex-col"
              htmlFor="confirm-delete-integration"
            >
              <p className="text-lg">Delete Integration</p>
              <p className="text-sm leading-5 text-white/50">
                This will remove the private key and any related resources on
                the 3rd party platform.
              </p>
            </Label>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={!confirmed}
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
