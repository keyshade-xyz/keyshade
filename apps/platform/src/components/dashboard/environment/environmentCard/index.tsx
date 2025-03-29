'use client'

import type { GetAllEnvironmentsOfProjectResponse } from '@keyshade/schema'
import dayjs from 'dayjs'
import { useSetAtom } from 'jotai'
import { SecretSVG, VariableSVG } from '@public/svg/dashboard'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  deleteEnvironmentOpenAtom,
  editEnvironmentOpenAtom,
  selectedEnvironmentAtom
} from '@/store'
import CopyToClipboard from '@/components/common/copy-to-clipboard'

interface EnvironmentCardProps {
  environment: GetAllEnvironmentsOfProjectResponse['items'][number],
  className?: string
}

const formatDate = (date: string): string => {
  return dayjs(date).format('D MMMM, YYYY')
}

export default function EnvironmentCard({
  environment,
  className
}: EnvironmentCardProps): React.JSX.Element {
  const setSelectedEnvironment = useSetAtom(selectedEnvironmentAtom)
  const setIsEditEnvironmentOpen = useSetAtom(editEnvironmentOpenAtom)
  const setIsDeleteEnvironmentOpen = useSetAtom(deleteEnvironmentOpenAtom)

  const handleEditClick = () => {
    setSelectedEnvironment(environment)
    setIsEditEnvironmentOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedEnvironment(environment)
    setIsDeleteEnvironmentOpen(true)
  }

  return (
    <ContextMenu key={environment.id}>
      <ContextMenuTrigger className="w-full">
        <div className={`flex h-fit flex-col rounded-xl border-[1px] border-white/20 bg-white/[2%] transition-all duration-150 ease-in hover:bg-white/[5%] ${className}`}>
          <div className="flex flex-col gap-y-2 px-6 py-4">
            <div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
              <div className="text-2xl">{environment.name}</div>
              <CopyToClipboard text={environment.slug} />
            </div>
            {environment.description ? (
              <div className="text-sm font-semibold text-white/50">
                {environment.description}
              </div>
            ) : null}
            <div className="flex flex-row items-center gap-x-4">
              <div className="flex flex-row items-center gap-x-1">
                <VariableSVG width={16} /> {environment.variables}
              </div>
              <div className="flex flex-row items-center gap-x-1">
                <SecretSVG width={16} /> {environment.secrets}
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between rounded-b-xl bg-white/[6%] px-6 py-4 text-sm text-white/50">
            <div className="flex flex-col">
              <div>Created At</div>
              <div>{formatDate(environment.createdAt)}</div>
            </div>
            <div className="flex flex-col items-end">
              <div>Updated By</div>
              <div>{environment.lastUpdatedBy.name}</div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          onSelect={handleEditClick}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          onSelect={handleDeleteClick}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
