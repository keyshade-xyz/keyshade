'use client'
import { ChevronsUpDown } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import type { Workspace } from '@keyshade/schema'
import { AddWorkspaceDialog } from '../shared/add-workspace-dialog'
import { Skeleton } from './skeleton'
import { WorkspaceListItem } from './workspace-list-item'
import { InfiniteScrollList } from './infinite-scroll-list'
import { Badge } from './badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import ControllerInstance from '@/lib/controller-instance'
import {
  allWorkspacesAtom,
  globalSearchDataAtom,
  selectedWorkspaceAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import {
  getSelectedWorkspaceFromStorage,
  setSelectedWorkspaceToStorage
} from '@/store/workspace'

export function Combobox(): React.JSX.Element {
  const workspaceFromStorage = getSelectedWorkspaceFromStorage()

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
        }
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
    (workspace: Workspace) => (
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
              slug: workspace.slug,
              icon: workspace.icon ?? '🔥'
            }))
          }))
          setAllWorkspaces(data.items)

          /**
           * If workspace stored in local storage is not found in the list of workspaces,
           * then set the selected workspace to the first one in the list.
           * This is to ensure that the selected workspace is always valid and belongs to the currently logged in user
           */
          const existingWorkspace = data.items.find(
            (item) =>
              item.id === workspaceFromStorage?.id &&
              item.ownerId === workspaceFromStorage.ownerId
          )
          if (!existingWorkspace) {
            const newSelectedWorkspace = data.items[0]
            setSelectedWorkspace(newSelectedWorkspace)
            setSelectedWorkspaceToStorage(newSelectedWorkspace)
          } else {
            setSelectedWorkspace(existingWorkspace)
          }
        }
      })
    }
  }, [
    setSelectedWorkspace,
    getWorkspacesOfUser,
    setGlobalSearchData,
    setAllWorkspaces,
    allWorkspaces,
    workspaceFromStorage
  ])

  const getSubscriptionPlanDisplay = useCallback((): {
    name: string
    color: `#${string}`
  } => {
    switch (selectedWorkspace?.subscription.trialPlan) {
      case 'FREE':
        return { name: 'Free', color: '#0DA6EF' }
      case 'HACKER':
        return { name: 'Hacker', color: '#92DC3C' }
      case 'TEAM':
        return { name: 'Team', color: '#2DBE99' }
      case 'ENTERPRISE':
        return { name: 'Enterprise', color: '#837DFF' }
      default:
        return { name: 'Free', color: '#0DA6EF' }
    }
  }, [selectedWorkspace])

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-controls="popover-content"
          aria-expanded={open}
          className="bg-night-d border-white/8 flex w-full items-center justify-between rounded-xl border p-3"
          role="combobox"
          type="button"
        >
          <div className="flex gap-x-[0.88rem]">
            <div className="bg-charcoal border-white/4 flex  aspect-square h-9 w-9 items-center justify-center rounded-lg border text-xl">
              {selectedWorkspace?.icon ?? '🔥'}
            </div>
            <div className="flex flex-col items-start justify-center">
              <div className="text-start text-sm font-normal text-white">
                {selectedWorkspace?.name ? (
                  <div className="flex items-center gap-x-1">
                    {selectedWorkspace.name}{' '}
                    <Badge
                      color={getSubscriptionPlanDisplay().color}
                      size="small"
                      type="none"
                      variant="solid"
                    >
                      {' '}
                      {getSubscriptionPlanDisplay().name}
                    </Badge>
                  </div>
                ) : (
                  <Skeleton className="h-6 w-[10vw]" />
                )}
              </div>
            </div>
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-zinc-900 text-white "
        style={{ width: 'var(--radix-popper-anchor-width)' }}
      >
        <div className="max-h-40 overflow-auto">
          <InfiniteScrollList<Workspace>
            fetchFunction={fetchWorkspaces}
            itemComponent={renderWorkspaceListItem}
            itemKey={(workspace) => workspace.id}
            itemsPerPage={10}
          />
        </div>
        <AddWorkspaceDialog />
      </PopoverContent>
    </Popover>
  )
}
