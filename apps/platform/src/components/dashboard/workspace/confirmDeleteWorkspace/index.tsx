'use client'

import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
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

// FIX 1: WarningIcon is now defined OUTSIDE the component
const WarningIcon = () => (
  <svg className="mt-0.5 mr-2.5 h-[18px] w-[18px] flex-shrink-0 text-[#999]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
  </svg>
)

export default function ConfirmDeleteWorkspace(): React.JSX.Element {
  const workspaceFromStorage = getSelectedWorkspaceFromStorage()

  const [allWorkspaces, setAllWorkspaces] = useAtom(allWorkspacesAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useAtom(
    deleteWorkspaceOpenAtom
  )

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
              <p className="text-xs text-emerald-300">
                The workspace has been deleted.
              </p>
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
    <AlertDialog
      open={isDeleteWorkspaceOpen}
      onOpenChange={handleClose}
    >
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 text-sm leading-relaxed text-[#ccc]">
          <p className="mb-6">
            Deleting this site will immediately remove it from your Dashboard.
          </p>

          <p className="mb-3 font-semibold text-white">I understand that :</p>
          
          <ul className="mb-6 space-y-3">
            <li className="flex items-start">
              <WarningIcon />
              <span>The secrets, variables, and environments related to this project would be removed permanently</span>
            </li>
            <li className="flex items-start">
              <WarningIcon />
              <span>Everyone in this workspace will lose access to this project</span>
            </li>
            <li className="flex items-start">
              <WarningIcon />
              <span>I can&apos;t retrieve the project in future</span>
            </li>
          </ul>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-input" className="text-sm text-[#ccc]">
              Please enter the name of the project to confirm your action.
            </label>
            <input
              id="confirm-input"
              className="w-full rounded border border-[#444] bg-[#1A1A1A] px-3 py-2.5 text-sm text-white placeholder-[#666] outline-none transition-colors focus:border-[#666]"
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
          {/* FIX 2: Added type="button" */}
          <button
            type="button"
            className="flex items-center justify-center rounded px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#444] bg-[#333]"
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
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
               </svg>
             )}
             {isLoading ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>

      </AlertDialogContent>
    </AlertDialog>
  )
}
