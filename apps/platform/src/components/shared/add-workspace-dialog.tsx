'use client'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useSetAtom, useAtom } from 'jotai'
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
import {
  allWorkspacesAtom,
  selectedWorkspaceAtom,
  globalSearchDataAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

export interface AddWorkspaceDialogProps {
  trigger?: React.ReactNode
}

export function AddWorkspaceDialog({ trigger }: AddWorkspaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [allWorkspaces, setAllWorkspaces] = useAtom(allWorkspacesAtom)

  const createWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.createWorkspace({
      name
    })
  )

  const setSelectedWorkspace = useSetAtom(selectedWorkspaceAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      return toast.error('Workspace name is empty', {
        description: 'Please enter a workspace name'
      })
    }

    // Check if there is a name that matches the trimmed version of the input
    const nameAlreadyExists = allWorkspaces.some(
      (workspace) => workspace.name.trim() === name.trim()
    )
    if (nameAlreadyExists) {
      return toast.error('Workspace exists', {
        description: 'Workspace with the same name already exists'
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
    allWorkspaces,
    createWorkspace,
    setAllWorkspaces,
    setGlobalSearchData,
    setSelectedWorkspace
  ])

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="mt-5 w-full">
            <AddSVG /> New workspace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1E1E1F]">
        <DialogHeader>
          <DialogTitle>Make a new workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your projects.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-8">
          <div className="flex items-center gap-4">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter the name"
              value={name}
            />
          </div>
          <div className="flex justify-end">
            <Button
              disabled={isLoading}
              onClick={handleCreate}
              variant="secondary"
            >
              Add workspace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
