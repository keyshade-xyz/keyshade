'use client'

import { ChevronsUpDown, Check } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AddSVG } from '@public/svg/shared'
import type { Workspace } from '@keyshade/schema'
import { useAtom } from 'jotai'
import { Input } from './input'
import { Label } from './label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './dialog'
import { Button } from './button'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'

export function Combobox(): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([])
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('')
  const [isNameEmpty, setIsNameEmpty] = useState<boolean>(false)

  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )

  const router = useRouter()

  const createWorkspace = useCallback(
    async (name: string) => {
      if (name === '') {
        setIsNameEmpty(true)
        return
      }
      setIsNameEmpty(false)

      const { data, error, success } =
        await ControllerInstance.getInstance().workspaceController.createWorkspace(
          {
            name
          },
          {}
        )

      if (success && data) {
        toast.success('Workspace created successfully')
        setSelectedWorkspace({ ...data, projects: 0 })
        setOpen(false)
      } else {
        throw new Error(JSON.stringify(error))
      }
    },
    [setIsNameEmpty, setOpen, setSelectedWorkspace]
  )

  useEffect(() => {
    ControllerInstance.getInstance()
      .workspaceController.getWorkspacesOfUser({}, {})
      .then(({ data, success, error }) => {
        if (success && data) {
          setAllWorkspaces(data.items)
          setSelectedWorkspace(data.items[0])
        } else {
          throw new Error(JSON.stringify(error))
        }
      })
  }, [setSelectedWorkspace])

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
              🔥
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
              {allWorkspaces.map((workspace) => {
                return (
                  <CommandItem
                    key={workspace.id}
                    onSelect={() => {
                      setSelectedWorkspace(workspace)
                      router.refresh()
                      setOpen(false)
                    }}
                  >
                    {' '}
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedWorkspace?.name === workspace.name
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />{' '}
                    {workspace.name}
                  </CommandItem>
                )
              })}
            </CommandList>
          </Command>
          <Dialog>
            <DialogTrigger className="w-full">
              <Button className="mt-5 w-full">
                <AddSVG /> New workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  {isNameEmpty ? (
                    <span className="ml-[3.5rem] mt-1 text-red-500">
                      Name cannot be empty
                    </span>
                  ) : null}
                </div>

                <div className="flex w-full justify-end">
                  <Button
                    onClick={() => {
                      createWorkspace(newWorkspaceName)
                        .then(() => {
                          toast.success('User details updated successfully')
                          router.refresh()
                        })
                        .catch(() => {
                          toast.error('Something went wrong!', {
                            description: (
                              <p className="text-xs text-red-300">
                                Failed to update the user details. Check console
                                for more info.
                              </p>
                            )
                          })
                        })
                    }}
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
