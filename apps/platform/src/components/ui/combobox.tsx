'use client'
import { ChevronsUpDown } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { AddSVG } from '@public/svg/shared'
import type { WorkspaceWithTierLimitAndProjectCount } from '@keyshade/schema'
import { Label } from './label'
import { Input } from './input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './dialog'
import { Button } from './button'
import { InfiniteScrollList } from './infinite-scroll-list'
import { WorkspaceListItem } from './workspace-list-item'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList
} from '@/components/ui/command'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'

export function Combobox(): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getWorkspacesOfUser = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser({})
  )

  const createWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.createWorkspace({
      name: newWorkspaceName
    })
  )

  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )

  const handleCreateWorkspace = useCallback(async () => {
    if (newWorkspaceName.trim() === '') {
      toast.error('Workspace name is empty', {
        description: 'Please enter a workspace name'
      })
      return
    }

    setIsLoading(true)
    toast.loading('Creating workspace...')

    try {
      const { success, data } = await createWorkspace()

      if (success && data) {
        toast.success('Workspace created successfully')
        setSelectedWorkspace(data)
        setOpen(false)
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [createWorkspace, newWorkspaceName, setSelectedWorkspace])

  const fetchWorkspaces = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      try {
        const response =
          await ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser(
            {
              page,
              limit
            }
          )
        return {
          success: response.success,
          error: response.error
            ? { message: response.error.message }
            : undefined,
          data: response.data ?? { items: [], metadata: { totalCount: 0 } }
        }
      } catch (error) {
        return {
          success: false,
          data: { items: [], metadata: { totalCount: 0 } },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    []
  )

  const renderWorkspaceListItem = useCallback(
    (workspace: WorkspaceWithTierLimitAndProjectCount) => (
      <WorkspaceListItem onClose={() => setOpen(false)} workspace={workspace} />
    ),
    [setOpen]
  )

  useEffect(() => {
    getWorkspacesOfUser().then(({ success, data }) => {
      if (success && data) {
        setSelectedWorkspace(data.items[0])
      }
    })
  }, [setSelectedWorkspace, getWorkspacesOfUser])

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-controls="popover-content"
          aria-expanded={open}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161819] px-[0.6875rem] py-[0.8125rem]"
          role="combobox"
          type="button"
        >
          <div className="flex gap-x-[0.88rem]">
            <div className="flex aspect-square items-center rounded-[0.3125rem] bg-[#0B0D0F] p-[0.62rem] text-xl">
              {selectedWorkspace?.icon ?? '🔥'}
            </div>
            <div className="flex flex-col items-start">
              <div className="text-lg text-white">
                {selectedWorkspace?.name ?? 'No workspace'}
              </div>
              <span className="text-xs text-white/55">
                {selectedWorkspace?.projects}{' '}
                {selectedWorkspace?.projects === 1 ? 'project' : 'projects'}
              </span>
            </div>
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-[#161819] text-white md:w-[16rem]">
        <div>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList className="max-h-[10rem]">
              <CommandEmpty>No workspace found.</CommandEmpty>
              <div className="max-h-[10rem] overflow-auto">
                <InfiniteScrollList<WorkspaceWithTierLimitAndProjectCount>
                  fetchFunction={fetchWorkspaces}
                  itemComponent={renderWorkspaceListItem}
                  itemKey={(workspace) => workspace.id}
                  itemsPerPage={4}
                />
              </div>
            </CommandList>
          </Command>
          <Dialog>
            <DialogTrigger asChild className="w-full">
              <Button className="mt-5 w-full">
                <AddSVG /> New workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E1E1F]">
              <DialogHeader>
                <DialogTitle>Make a new workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your projects.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-y-8">
                <div className="flex w-full flex-col">
                  <div className="flex flex-row items-center gap-4">
                    <Label className="text-right" htmlFor="name">
                      Name
                    </Label>
                    <Input
                      className="col-span-3"
                      id="name"
                      onChange={(e) => {
                        setNewWorkspaceName(e.target.value)
                      }}
                      placeholder="Enter the name"
                    />
                  </div>
                </div>

                <div className="flex w-full justify-end">
                  <Button
                    disabled={isLoading}
                    onClick={handleCreateWorkspace}
                    variant="secondary"
                  >
                    Add workspace
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  )
}
