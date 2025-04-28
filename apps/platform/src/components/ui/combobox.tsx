'use client'
import { ChevronsUpDown } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import type { WorkspaceWithTierLimitAndProjectCount } from '@keyshade/schema'
import { AddWorkspaceDialog } from '../shared/add-workspace-dialog'
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
import {
  allWorkspacesAtom,
  globalSearchDataAtom,
  selectedWorkspaceAtom,
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import { getSelectedWorkspaceFromStorage, setSelectedWorkspaceToStorage } from '@/store/workspace'

export function Combobox(): React.JSX.Element {
  const workspaceFromStorage = getSelectedWorkspaceFromStorage();

  const [open, setOpen] = useState<boolean>(false)

  const getWorkspacesOfUser = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser({})
  )

  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)
  const [allWorkspaces, setAllWorkspaces] = useAtom(allWorkspacesAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )

  const fetchWorkspaces = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      // Check if workspaces are already loaded
      if (allWorkspaces.length > 0 && allWorkspaces.length > page * limit) {
        return {
          success: true,
          error: undefined,
          data: {
            items: allWorkspaces,
            metadata: { totalCount: allWorkspaces.length }
          }
        };
      }

      // If not loaded, fetch from API
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
    [allWorkspaces]
  )

  const renderWorkspaceListItem = useCallback(
    (workspace: WorkspaceWithTierLimitAndProjectCount) => (
      <WorkspaceListItem onClose={() => setOpen(false)} workspace={workspace} />
    ),
    [setOpen]
  )

  useEffect(() => {
    if (allWorkspaces.length === 0) {

      getWorkspacesOfUser().then(({ success, data }) => {
        if (success && data) {
          setGlobalSearchData((prev) => ({
            ...prev,
            workspaces: data.items.map((workspace) => ({
              id: workspace.id,
              name: workspace.name,
              slug: workspace.slug
            }))
          }))
          setAllWorkspaces(data.items)

          /**
           * If workspace stored in local storage is not found in the list of workspaces,
           * then set the selected workspace to the first one in the list.
           * This is to ensure that the selected workspace is always valid and belongs to the currently logged in user
           */
          const existingWorkspace = data.items.find(item => item.id === workspaceFromStorage?.id && item.ownerId === workspaceFromStorage.ownerId);
          // eslint-disable-next-line no-console -- debug
          console.log('existingWorkspace', existingWorkspace)
          if (!existingWorkspace) {
            const newSelectedWorkspace = data.items[0];
            setSelectedWorkspace(newSelectedWorkspace);
            setSelectedWorkspaceToStorage(newSelectedWorkspace);
          } else {
            setSelectedWorkspace(existingWorkspace);
          }
        }
      })
    }
  }, [setSelectedWorkspace, getWorkspacesOfUser, setGlobalSearchData, setAllWorkspaces, allWorkspaces, workspaceFromStorage])

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
                  itemsPerPage={10}
                />
              </div>
            </CommandList>
          </Command>
          <AddWorkspaceDialog />
        </div>
      </PopoverContent>
    </Popover>
  )
}
