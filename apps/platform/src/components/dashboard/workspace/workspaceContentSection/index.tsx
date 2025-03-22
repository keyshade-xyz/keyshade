import type { EmojiClickData } from 'emoji-picker-react'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom, allWorkspacesAtom } from '@/store'

const EmojiPicker = dynamic(
  () => {
    return import('emoji-picker-react')
  },
  { ssr: false }
)

export default function WorkspaceContentSection(): React.JSX.Element {
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
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

  function handleEmojiSelect(emojiData: EmojiClickData) {
    setWorkspaceData({
      ...workspaceData,
      icon: emojiData.emoji
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
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
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
    <section className="mt-8 flex flex-col items-start gap-10 border-b border-b-white/20 pb-10">
      {/* emoji picker */}
      <div className="flex items-center gap-9">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#0B0D0F]">
          <span
            aria-label="emoji"
            className="text-4xl"
            onClick={() => setShowPicker(!showPicker)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowPicker(!showPicker)
              }
            }}
            role="button"
            tabIndex={0}
          >
            {workspaceData.icon}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">Workspace Icon</h3>
          <p className="text-sm font-medium text-white/60">
            Upload a picture to change your workspace icon across Keyshade.
          </p>
        </div>
      </div>

      {showPicker ? <EmojiPicker onEmojiClick={handleEmojiSelect} /> : null}

      {/* name */}
      <div className="flex gap-20">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xl" htmlFor="name">
              Name
            </Label>
            <p className="text-sm text-white/60">
              You can add the name of the workspace here.
            </p>
          </div>
          <Input
            id="name"
            onChange={handleNameChange}
            placeholder="Workspace name"
            value={workspaceData.name}
          />
        </div>
      </div>

      <Button disabled={isLoading} onClick={handleSaveDetails}>
        Save Details
      </Button>
    </section>
  )
}
