import { History } from 'lucide-react'
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

interface ConfirmRollbackDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  version: number
  isLoading: boolean
}

export default function ConfirmRollbackDialog({
  isLoading,
  isOpen,
  onClose,
  onConfirm,
  version
}: ConfirmRollbackDialogProps) {
  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B]">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <History className="h-5 w-5" />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you want to rollback to version {version}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. Proceeding would reset your
            secret&apos;s value for this environment to a value from the past.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={onClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-red-600 text-white hover:bg-red-600/80"
            disabled={isLoading}
            onClick={onConfirm}
          >
            Yes, rollback
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
