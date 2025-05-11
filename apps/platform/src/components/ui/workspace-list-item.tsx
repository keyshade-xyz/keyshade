'use client'

import { Check } from 'lucide-react'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import type { WorkspaceWithTierLimitAndProjectCount } from '@keyshade/schema'
import { cn } from '@/lib/utils'
import { selectedWorkspaceAtom } from '@/store'
import { CommandItem } from '@/components/ui/command'
import { setSelectedWorkspaceToStorage } from '@/store/workspace'

interface WorkspaceListItemProps {
  workspace: WorkspaceWithTierLimitAndProjectCount
  onClose: () => void
}

export function WorkspaceListItem({
  workspace,
  onClose
}: WorkspaceListItemProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const router = useRouter()

  const isSelected = selectedWorkspace?.name === workspace.name

  const handleSelect = () => {
    setSelectedWorkspace(workspace)
    setSelectedWorkspaceToStorage(workspace);
    router.push('/')
    onClose()
  }

  return (
    <CommandItem onSelect={handleSelect}>
      <Check
        className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
      />
      {workspace.icon ?? '🔥'} {workspace.name}
    </CommandItem>
  )
}
