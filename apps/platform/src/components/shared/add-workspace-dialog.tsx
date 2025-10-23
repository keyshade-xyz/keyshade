'use client'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useSetAtom } from 'jotai'
import { AddSVG } from '@public/svg/shared'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import {
  allWorkspacesAtom,
  selectedWorkspaceAtom,
  globalSearchDataAtom
} from '@/store'

export interface AddWorkspaceDialogProps {
  trigger?: React.ReactNode
}

export function AddWorkspaceDialog({
  trigger
}: AddWorkspaceDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const createWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.createWorkspace({
      name
    })
  )

  const setAllWorkspaces = useSetAtom(allWorkspacesAtom)
  const setSelectedWorkspace = useSetAtom(selectedWorkspaceAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      return toast.error('Workspace name is empty', {
        description: 'Please enter a workspace name'
      })
    }

    setIsLoading(true)
    toast.loading('Creating workspace…')
    try {
      const { success, data } = await createWorkspace()
      if (success && data) {
        toast.success('Workspace created!')
        // update your atoms
        setAllWorkspaces((prev) => [data, ...prev])
        setGlobalSearchData((prev) => ({
          ...prev,
          workspaces: [
            {
              id: data.id,
              name: data.name,
              slug: data.slug,
              icon: data.icon ?? '🔥'
            },
            ...prev.workspaces
          ]
        }))
        setSelectedWorkspace(data)
        setOpen(false)
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }, [
    name,
    createWorkspace,
    setAllWorkspaces,
    setGlobalSearchData,
    setSelectedWorkspace
  ])

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <div>
          <div className="bg-white/12 border-white/4 my-1 h-px w-full border" />
          {trigger ?? (
            <button
              className="hover:bg-night-c flex w-full cursor-pointer items-center justify-start gap-x-2 rounded-lg p-2 text-sm text-neutral-500 transition-colors"
              type="button"
            >
              <div className="bg-charcoal border-white/4 flex  aspect-square h-9 w-9 items-center justify-center rounded-lg border text-xl">
                <AddSVG />
              </div>
              Create a New Workspace
            </button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[783px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-5">
          <DialogDescription>
            Create a new workspace to organize your projects.
          </DialogDescription>

          <div className="flex flex-col gap-4">
            <Label htmlFor="workspace-name">
              Workspace Name <span className="font-medium text-red-500">*</span>
            </Label>
            <Input
              id="workspace-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your workspace name"
              value={name}
            />
          </div>
          <div className="flex justify-end gap-x-3">
            <Button
              disabled={isLoading}
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button disabled={isLoading} onClick={handleCreate}>
              Add workspace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
