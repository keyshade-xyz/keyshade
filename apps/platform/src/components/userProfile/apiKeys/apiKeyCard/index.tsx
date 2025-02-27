'use client'

import type { ApiKey } from '@keyshade/schema'
import dayjs from 'dayjs'
import { useSetAtom } from 'jotai'
import { CrownSVG } from '@public/svg/shared'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  selectedApiKeyAtom,
  editApiKeyOpenAtom,
  deleteApiKeyOpenAtom
} from '@/store'
import Slug from '@/components/common/slug'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const formatDate = (date: string): string => {
  return dayjs(date).diff(dayjs(), 'day') >= 1
    ? `${dayjs(date).diff(dayjs(), 'day')} days`
    : `${dayjs(date).diff(dayjs(), 'hour')} hours`
}

export default function ApiKeyCard({
  apiKey
}: {
  apiKey: ApiKey
}): React.JSX.Element {
  const setSelectedApiKey = useSetAtom(selectedApiKeyAtom)
  const _setIsEditApiKeyOpen = useSetAtom(editApiKeyOpenAtom)
  const setIsDeleteApiKeyOpen = useSetAtom(deleteApiKeyOpenAtom)

  const handleDeleteClick = () => {
    setSelectedApiKey(apiKey)
    setIsDeleteApiKeyOpen(true)
  }

  return (
    <ContextMenu key={apiKey.id}>
      <ContextMenuTrigger className="w-full">
        <div className="flex h-fit flex-col rounded-xl border-[1px] border-white/20 bg-white/[2%] transition-all duration-150 ease-in hover:bg-white/[5%]">
          <div className="flex flex-col gap-y-6 px-6 py-4">
            <div className="flex flex-row">
              <div className="flex w-full flex-row items-center justify-between">
                <div className="text-2xl font-normal"> {apiKey.name} </div>
              </div>
              <div className="flex w-1/2 flex-col">
                <Slug text={apiKey.slug} />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between">
              <div className="text-sm font-medium"> {apiKey.preview} </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center justify-center gap-1 rounded-md bg-[#5A5A5A] px-1 py-0.5 text-xs font-bold">
                      <CrownSVG />
                      {apiKey.authorities.length}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="rounded border-none bg-[#3F3F46] text-sm font-bold text-white">
                    <p>Show Attributes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex flex-row items-end justify-between rounded-b-xl bg-white/[6%] px-6 py-4 text-sm text-white/50">
            <div className="flex flex-col items-start text-sm font-medium">
              <div>Created on</div>
              <div>{dayjs(apiKey.createdAt).format('D MMMM, YYYY')}</div>
            </div>
            <div className="flex flex-col items-end">
              <div>{apiKey.expiresAt === null ? 'Never' : 'Expiring in'}</div>
              <div>
                {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Expiring'}
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide">
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
