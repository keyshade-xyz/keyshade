import type { Dispatch, SetStateAction } from 'react'
import React from 'react'
import type { Workspace } from '@keyshade/schema'
import {
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@/components/ui/command'

interface WorkspaceSearchSectionProps {
  workspaces: { id: string; slug: string; name: string; icon: string }[]
  handleChangeWorkspace: (workspace: Workspace) => void
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export default function WorkspaceSearchSection({
  workspaces,
  handleChangeWorkspace,
  setIsOpen
}: WorkspaceSearchSectionProps) {
  return (
    <>
      <CommandGroup heading="Workspaces">
        {workspaces.map((workspace) => (
          <CommandItem
            key={workspace.id}
            onClick={() => {
              handleChangeWorkspace(workspace)
              setIsOpen(false)
            }}
          >
            <span className="mr-2">{workspace.icon}</span>
            <span className="w-[111px] truncate">{workspace.name}</span>
            {workspace.slug ? (
              <span className="ml-2 text-sm text-gray-200">
                ({workspace.slug})
              </span>
            ) : null}
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
    </>
  )
}
