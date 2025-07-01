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
import { cn, validateAlphanumericInput } from '@/lib/utils'

export interface AddWorkspaceDialogProps {
  trigger?: React.ReactNode
}

export function AddWorkspaceDialog({ trigger }: AddWorkspaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceNameError, setWorkspaceNameError] = useState<string>('')

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
            <div className='flex flex-col gap-2 w-full'>
              <Input
                className={cn({ 'border-red-500': Boolean(workspaceNameError) })}
                id="workspace-name"
                onChange={(e) => {
                  const value = e.target.value
                  setWorkspaceNameError(!validateAlphanumericInput(value) ? 'Only English letters and digits are allowed.' : '')
                  setName(value)
                }}
                placeholder="Enter the name"
                value={name}
              />
              {workspaceNameError ? <span className="text-xs text-red-500 my-2">{workspaceNameError}</span> : null}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={isLoading || Boolean(workspaceNameError)}
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
