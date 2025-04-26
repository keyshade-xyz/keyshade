'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  allWorkspacesAtom,
  deleteWorkspaceOpenAtom,
  selectedWorkspaceAtom,
  membersOfWorkspaceAtom,
  userAtom
} from '@/store'
import ConfirmDeleteWorkspace from '@/components/dashboard/workspace/confirmDeleteWorkspace'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import AvatarComponent from '@/components/common/avatar'
import { formatDate } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PageTitle } from '@/components/common/page-title'

export default function WorkspaceSettingsPage(): JSX.Element {
  const router = useRouter()

  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useAtom(
    deleteWorkspaceOpenAtom
  )
  const members = useAtomValue(membersOfWorkspaceAtom)
  const user = useAtomValue(userAtom)

  const setAllWorkspaces = useSetAtom(allWorkspacesAtom)

  const [showPicker, setShowPicker] = useState(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [workspaceData, setWorkspaceData] = useState<{
    name: string
    icon: string | null
  }>({
    name: selectedWorkspace?.name || '',
    icon: selectedWorkspace?.icon || '🔥'
  })

  const [isLeavingWorkspace, setIsLeavingWorkspace] = useState<boolean>(false)

  const leaveWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.leaveWorkspace({
      workspaceSlug: selectedWorkspace!.slug
    })
  )

  const isOnlyMember = members.length === 1

  function handleEmojiSelect(emojiData: string) {
    setWorkspaceData({
      ...workspaceData,
      icon: emojiData
    })
    setShowPicker(false)
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWorkspaceData({
      ...workspaceData,
      name: e.target.value
    })
  }

  const updateWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.updateWorkspace({
      workspaceSlug: selectedWorkspace!.slug,
      icon: workspaceData.icon,
      name:
        workspaceData.name === selectedWorkspace?.name
          ? undefined
          : workspaceData.name
    })
  )

  const handleLeaveWorkspace = useCallback(async () => {
    if (!selectedWorkspace) return
    
    setIsLeavingWorkspace(true)
    const loadingToast = toast.loading('Leaving workspace...')
    
    try {
      const { success } = await leaveWorkspace()
      
      if (success) {
        setAllWorkspaces((prev) => prev.filter(w => w.id !== selectedWorkspace.id))
        router.push('/')
        toast.success('Successfully left the workspace')
      }
    } catch (error) {
      toast.error('Failed to leave the workspace')
    } finally {
      setIsLeavingWorkspace(false)
      toast.dismiss(loadingToast)
    }
  }, [leaveWorkspace, router, selectedWorkspace, setAllWorkspaces])

  const handleSaveDetails = useCallback(async () => {
    if (selectedWorkspace) {
      if (workspaceData.name.trim().length === 0) {
        toast.error('Workspace name cannot be empty', {
          description: (
            <p className="text-xs text-red-300">
              Please provide a valid name for the workspace.
            </p>
          )
        })
      }

      setIsLoading(true)
      toast.loading('Updating workspace details...')

      try {
        const { success, data } = await updateWorkspace()

        if (success && data) {
          toast.success('Workspace details successfully updated')

          // Update the selected workspace
          setSelectedWorkspace({
            ...selectedWorkspace,
            name: data.name,
            icon: data.icon
          })

          // Update the all workspaces
          setAllWorkspaces((prevWorkspaces) =>
            prevWorkspaces.map((workspace) => {
              if (workspace.id === data.id) {
                return {
                  ...workspace,
                  name: data.name,
                  slug: data.slug,
                  icon: data.icon
                }
              }
              return workspace
            })
          )

          if (data.slug !== selectedWorkspace.slug) {
            // Update the URL
            router.push(`/${data.slug}`)
          }
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    router,
    selectedWorkspace,
    setAllWorkspaces,
    setSelectedWorkspace,
    updateWorkspace,
    workspaceData.name
  ])

  useEffect(() => {
    if (selectedWorkspace) {
      const { name, icon } = selectedWorkspace

      setWorkspaceData((prev) => ({
        ...prev,
        name: name || '',
        icon: icon || '🔥'
      }))
    }
  }, [selectedWorkspace])

  return (
    <main>
      <PageTitle title={`${selectedWorkspace?.name} | Settings`} />
      <div className="flex w-full flex-col gap-4 px-10 py-7 lg:w-[80vw] xl:w-[50vw]">
        {/* Header */}
        <section className="mb-5 flex flex-col gap-y-5">
          <div className="flex flex-row items-center gap-x-5">
            <div className="flex aspect-square h-[60px] w-[60px] items-center justify-center rounded-[0.3125rem] bg-[#0B0D0F] p-[0.62rem] text-xl">
              {selectedWorkspace?.icon ?? '🔥'}
            </div>
            <div className="flex flex-grow flex-col gap-y-2">
              {/* <div className="mb-2 flex flex-row gap-x-2">
              </div> */}
              <h1 className="text-2xl font-bold">{selectedWorkspace?.name}</h1>
              {selectedWorkspace ? (
                <div className="flex flex-row gap-x-2 text-white/60">
                  <div className="flex flex-row gap-x-1 text-sm">
                    <span>Last updated by</span>
                    <AvatarComponent
                      name={
                        selectedWorkspace.lastUpdateBy?.name ||
                        selectedWorkspace.ownedBy.name
                      }
                      profilePictureUrl={
                        selectedWorkspace.lastUpdateBy?.profilePictureUrl ||
                        selectedWorkspace.ownedBy.profilePictureUrl
                      }
                    />
                    <span className="font-semibold text-white/90">
                      {selectedWorkspace.lastUpdateBy?.name ||
                        selectedWorkspace.ownedBy.name}
                    </span>
                  </div>
                  <div className="flex flex-row gap-x-1 text-sm">
                    <span>on</span>
                    <span className="font-semibold text-white/90">
                      {formatDate(
                        selectedWorkspace.updatedAt ||
                          selectedWorkspace.createdAt
                      )}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="h-fit">
              <CopyToClipboard text={selectedWorkspace?.slug || ''} />
            </div>
          </div>
          {selectedWorkspace ? (
            <div className="mt-2 flex flex-row items-center gap-x-2 rounded-md border-[1px] border-white/20 p-2 text-sm text-white/60">
              <AvatarComponent
                name={selectedWorkspace.ownedBy.name}
                profilePictureUrl={selectedWorkspace.ownedBy.profilePictureUrl}
              />
              <span>
                <span className="font-semibold text-white/90">
                  {selectedWorkspace.ownedBy.name}
                </span>{' '}
                has been the owner of this workspace since{' '}
                <span className="font-semibold text-white/90">
                  {formatDate(selectedWorkspace.ownedBy.ownedSince)}
                </span>
              </span>
            </div>
          ) : null}
        </section>

        <Separator className="bg-white/20" />

        {/* Name */}
        <section className="my-5 flex w-full flex-row items-center">
          <div className="flex w-3/5 flex-col gap-y-2">
            <span className="text-lg font-semibold">Name</span>
            <span className="text-sm text-white/60">
              Update the name of your workspace here
            </span>
          </div>
          <Input
            className="w-fit flex-grow"
            id="name"
            onChange={handleNameChange}
            placeholder="Workspace name"
            value={workspaceData.name}
          />
        </section>

        <Separator className="bg-white/20" />

        {/* Icon */}
        <section className="my-5 flex w-full flex-row items-center">
          <div className="flex w-3/5 flex-col gap-y-2">
            <span className="text-lg font-semibold">Icon</span>
            <span className="text-sm text-white/60">
              Update the icon of your workspace here
            </span>
          </div>
          <div className="flex flex-row justify-end gap-x-4">
            <Popover onOpenChange={setShowPicker} open={showPicker}>
              <PopoverTrigger asChild>
                <div className="flex aspect-square h-[60px] w-[60px] items-center justify-center rounded-[0.3125rem] bg-[#0B0D0F] p-[0.62rem] text-xl cursor-pointer">
                  {workspaceData.icon}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-0">
                <EmojiPicker
                  className="h-[342px]"
                  onEmojiSelect={({ emoji }) => handleEmojiSelect(emoji)}
                >
                  <EmojiPickerSearch />
                  <EmojiPickerContent />
                  <EmojiPickerFooter />
                </EmojiPicker>
              </PopoverContent>
            </Popover>
          </div>
        </section>

        <Separator className="bg-white/20" />

        {/* Billing Method */}
        <section className="my-5 flex w-full flex-row items-center">
          <div className="flex w-3/5 flex-col gap-y-2">
            <span className="text-lg font-semibold">Billing Method</span>
            <span className="text-sm text-white/60">
              Update the billing method of your workspace here
            </span>
          </div>
          <div className="w-2/5 rounded-lg border-[1px] border-white/50 px-4 py-3 text-center">
            Coming Soon
          </div>
        </section>

        <Separator className="bg-white/20" />

        {/* Leave Workspace */}
        <section className="my-5 flex w-full flex-row items-center rounded-lg border-[1px] border-yellow-500 bg-yellow-500/10 p-5">
          <div className="flex w-3/5 flex-col gap-y-2">
            <span className="text-lg font-semibold text-yellow-500">
              Leave Workspace
            </span>
            <span className="text-sm text-white/60">
              Remove yourself from this workspace. You will no longer have access to its resources.
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="flex w-2/5 items-center gap-x-2 bg-yellow-600 text-white/90 transition-all duration-100 ease-in-out hover:bg-yellow-500"
                  disabled={
                    isLeavingWorkspace || 
                    selectedWorkspace?.isDefault || 
                    isOnlyMember ||
                    user?.email === selectedWorkspace?.ownedBy.email
                  }
                  onClick={handleLeaveWorkspace}
                  role="button"
                >
                  <span>Leave workspace</span>
                </Button>
              </TooltipTrigger>
              {selectedWorkspace?.isDefault ? (
                <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                  <p>This is your default workspace. You can't leave it.</p>
                </TooltipContent>
              ) : isOnlyMember ? (
                <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                  <p>You can't leave a workspace where you are the only member.</p>
                </TooltipContent>
              ) : user?.email === selectedWorkspace?.ownedBy.email ? (
                <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                  <p>You can't leave a workspace you own. Transfer ownership first.</p>
                </TooltipContent>
              ) : null}
            </Tooltip>
          </TooltipProvider>
        </section>

        <Separator className="bg-white/20" />

        {/* Delete Workspace */}
        <section className="my-5 flex w-full flex-row items-center rounded-lg border-[1px] border-red-500 bg-red-500/10 p-5">
          <div className="flex w-3/5 flex-col gap-y-2">
            <span className="text-lg font-semibold text-red-500">
              Delete Workspace
            </span>
            <span className="text-sm text-white/60">
              Removes the workspace from our databases.
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="flex w-2/5 items-center gap-x-2 bg-red-600 text-white/90 transition-all duration-100 ease-in-out hover:bg-red-500"
                  disabled={isLoading || selectedWorkspace?.isDefault}
                  onClick={() => setIsDeleteWorkspaceOpen(true)}
                  role="button"
                >
                  <span>Delete workspace</span>
                </Button>
              </TooltipTrigger>
              {selectedWorkspace?.isDefault ? (
                <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                  <p>This is your default workspace. You can not delete it.</p>
                </TooltipContent>
              ) : null}
            </Tooltip>
          </TooltipProvider>
        </section>

        <Separator className="bg-white/20" />

        {/* Save Button */}
        <section className="my-5 flex w-full flex-row items-center">
          <div className="w-3/5" />
          <Button
            className="w-2/5"
            disabled={isLoading}
            onClick={handleSaveDetails}
            type="button"
          >
            Save changes
          </Button>
        </section>
      </div>

      {/* Delete workspace alert dialog */}
      {isDeleteWorkspaceOpen && selectedWorkspace ? (
        <ConfirmDeleteWorkspace />
      ) : null}
    </main>
  )
}
