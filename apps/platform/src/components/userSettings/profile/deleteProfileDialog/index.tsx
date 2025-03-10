import { TrashSVG } from '@public/svg/shared'
import React, { useCallback } from 'react'
import { useAtom } from 'jotai'
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
import { deleteAccountOpenAtom } from '@/store'

export default function DeleteProfileDialog({ handleDeleteSelf }: { handleDeleteSelf: () => Promise<void> }) {
  const [isDeleteAccountOpenAtom, setIsDeleteAccountOpenAtom] = useAtom(deleteAccountOpenAtom)

  const handleClose = useCallback(() => {
    setIsDeleteAccountOpenAtom(false)
  }, [setIsDeleteAccountOpenAtom])

  return (
    <AlertDialog
      aria-hidden={!isDeleteAccountOpenAtom}
      onOpenChange={handleClose}
      open={isDeleteAccountOpenAtom}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete your account?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your account for forever and we can&apos;t help you afterwards to restore.
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
            onClick={handleDeleteSelf}
          >
            Yes, delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
