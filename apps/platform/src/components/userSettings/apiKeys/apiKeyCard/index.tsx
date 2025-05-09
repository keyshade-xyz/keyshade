'use client'

import type { ApiKey as OriginalApiKey } from '@keyshade/schema'
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
  deleteApiKeyOpenAtom,
  editApiKeyOpenAtom
} from '@/store'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

type ApiKey = Omit<OriginalApiKey, 'value' | 'userId'>

const formatDate = (date: string): string => {
  const now = dayjs();
  return now.diff(date, 'day') >= 1
    ? `${now.diff(date, 'day')} days`
    : `${now.diff(date, 'hour')} hours`
}

export default function ApiKeyCard({
  apiKey
}: {
  apiKey: ApiKey
}): React.JSX.Element {
  const setSelectedApiKey = useSetAtom(selectedApiKeyAtom)
  const setIsDeleteApiKeyOpen = useSetAtom(deleteApiKeyOpenAtom)
  const setIsEditApiKeyOpen = useSetAtom(editApiKeyOpenAtom)

  const handleDeleteClick = () => {
    setSelectedApiKey(apiKey)
    setIsDeleteApiKeyOpen(true)
  }

  const handleEditClick = () => {
    setSelectedApiKey(apiKey)
    setIsEditApiKeyOpen(true)
  }

  return (
    <ContextMenu key={apiKey.id}>
      <ContextMenuTrigger className="w-full">
        <div className="flex h-fit flex-col rounded-xl border-[1px] border-white/20 bg-white/[2%] transition-all duration-150 ease-in hover:bg-white/[5%]">
          <div className="flex flex-col gap-y-6 px-6 py-4">
            <div className="flex flex-row flex-wrap justify-between gap-2">
              <div className="text-2xl font-normal"> {apiKey.name} </div>
              <CopyToClipboard text={apiKey.slug} />
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
                    <p>Show Authorities</p>
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
