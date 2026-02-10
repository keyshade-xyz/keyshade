'use client'

import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { TrashSVG, WarningSVG, CloseSVG, SpinnerSVG } from '@public/svg/shared'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  allWorkspacesAtom,
  deleteWorkspaceOpenAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { getSelectedWorkspaceFromStorage, setSelectedWorkspaceToStorage } from '@/store/workspace'

export default function ConfirmDeleteWorkspace(): React.JSX.Element {
  const workspaceFromStorage = getSelectedWorkspaceFromStorage()

  const [allWorkspaces, setAllWorkspaces] = useAtom(allWorkspacesAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(selectedWorkspaceAtom)
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useAtom(deleteWorkspaceOpenAtom)

  const [confirmWorkspaceName, setConfirmWorkspaceName] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const deleteWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.deleteWorkspace({
      workspaceSlug: selectedWorkspace!.slug
    })
  )

  const handleClose = useCallback(() => {
    setIsDeleteWorkspaceOpen(false)
    setConfirmWorkspaceName('')
  }, [setIsDeleteWorkspaceOpen])

  const handleDeleteWorkspace = async () => {
    if (selectedWorkspace) {
      setIsLoading(true)
      toast.loading('Deleting workspace...')

      try {
        const { success } = await deleteWorkspace()

        if (success) {
          toast.success('Workspace deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">The workspace has been deleted.</p>
            )
          })

          const remainingWorkspaces = allWorkspaces.filter(
            (workspace) => workspace.id !== selectedWorkspace.id
          )
          setAllWorkspaces(remainingWorkspaces)

          if (workspaceFromStorage?.id === selectedWorkspace.id) {
            setSelectedWorkspaceToStorage(remainingWorkspaces[0]);
          }

          setSelectedWorkspace(remainingWorkspaces[0])
        }
      } finally {
        handleClose()
        setIsLoading(false)
        toast.dismiss()
        router.push('/')
      }
    }
  }

  return (
    <AlertDialog open={isDeleteWorkspaceOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-[600px] gap-0 border border-[#333] bg-[#1A1A1A] p-0 text-white shadow-2xl sm:rounded-md">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#333] px-6 py-5">
          <AlertDialogTitle className="text-xl font-semibold text-white">
            Delete {selectedWorkspace?.name}?
          </AlertDialogTitle>
          <button 
            type="button" 
            onClick={handleClose} 
            className="flex items-center justify-center rounded p-1 text-[#999] transition-colors hover:text-white"
          >
            <CloseSVG className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 text-sm leading-relaxed text-[#ccc]">
          <p className="mb-6">Deleting this site will immediately remove it from your Dashboard.</p>
          <p className="mb-3 font-semibold text-white">I understand that :</p>
          
          <ul className="mb-6 space-y-3">
            {[
              "The secrets, variables, and environments related to this project would be removed permanently",
              "Everyone in this workspace will lose access to this project",
              "I can't retrieve the project in future"
            ].map((text, idx) => (
              <li key={idx} className="flex items-start">
                <WarningSVG className="mt-0.5 mr-2.5 h-[18px] w-[18px] flex-shrink-0 text-[#999]" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-input" className="text-sm text-[#ccc]">
              Please enter the name of the project to confirm your action.
            </label>
            <input
              id="confirm-input"
              className="w-full rounded border border-[#444] bg-[#1A1A1A] px-3 py-2.5 text-sm text-white placeholder-[#666] outline-none focus:border-[#666]"
              disabled={isLoading}
              onChange={(e) => setConfirmWorkspaceName(e.target.value)}
              placeholder={selectedWorkspace?.name}
              type="text"
              value={confirmWorkspaceName}
              autoComplete="off"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-[#333] bg-[#1A1A1A] px-6 py-5">
          <button
            type="button"
            className="rounded px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#444] bg-[#333]"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
        
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition-colors bg-[#E53935] hover:bg-[#D32F2F] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              isLoading || 
              allWorkspaces.length === 1 || 
              confirmWorkspaceName !== selectedWorkspace?.name
            }
            onClick={handleDeleteWorkspace}
          >
             {isLoading ? (
                <SpinnerSVG className="animate-spin h-4 w-4 text-white" />
             ) : (
                <TrashSVG className="w-4 h-4 text-white" />
             )}
             {isLoading ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
