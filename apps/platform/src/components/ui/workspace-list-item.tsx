'use client'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import type { Workspace } from '@keyshade/schema'
import { useCallback } from 'react'
import { TickCircleFillSVG } from '@public/svg/dashboard'
import { Badge } from './badge'
import { selectedWorkspaceAtom } from '@/store'
import { setSelectedWorkspaceToStorage } from '@/store/workspace'

interface WorkspaceListItemProps {
  workspace: Workspace
  onClose: () => void
}

export function WorkspaceListItem({
  workspace,
  onClose
}: WorkspaceListItemProps): React.JSX.Element {
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const router = useRouter()

  const isSelected = selectedWorkspace?.name === workspace.name

  const handleSelect = () => {
    setSelectedWorkspace(workspace)
    setSelectedWorkspaceToStorage(workspace)
    router.replace('/')
    onClose()
  }

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
    <button
      className="hover:bg-night-c my-2 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 transition-colors"
      onClick={handleSelect}
      type="button"
    >
      <div className="flex items-center gap-x-2">
        <div className="bg-charcoal border-white/4 flex  aspect-square h-9 w-9 items-center justify-center rounded-lg border text-xl">
          {workspace.icon ?? '🔥'}
        </div>

        <span className="max-w-[111px] truncate text-start text-sm">
          {workspace.name}
        </span>
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
      {isSelected ? <TickCircleFillSVG /> : null}
    </button>
  )
}
