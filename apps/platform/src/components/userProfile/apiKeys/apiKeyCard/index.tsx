'use client'

import type { ApiKey } from '@keyshade/schema'
import dayjs from 'dayjs'
import { useSetAtom } from 'jotai'
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
import { CrownSVG } from '@public/svg/shared'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const formatDate = (date: string): string => {
  return dayjs(date).format('D MMMM, YYYY')
}

export default function ApiKeyCard({
  apiKey
}: {
  apiKey: ApiKey
}): React.JSX.Element {
  const setSelectedApiKey = useSetAtom(selectedApiKeyAtom)
  const setIsEditApiKeyOpen = useSetAtom(editApiKeyOpenAtom)
  const setIsDeleteApiKeyOpen = useSetAtom(deleteApiKeyOpenAtom)

  const handleDeleteClick = () => {
    setSelectedApiKey(apiKey)
    setIsDeleteApiKeyOpen(true)
  }

  return (
    <ContextMenu key={apiKey.id}>
      <ContextMenuTrigger className="w-full hover:cursor-pointer">
        <div className="flex h-fit flex-col rounded-xl border-[1px] border-white/20 bg-white/[2%] transition-all duration-150 ease-in hover:bg-white/[5%]">
          <div className="flex flex-col gap-y-6 px-6 py-4">
            <div className='flex flex-row'>
              <div className="flex w-full flex-row items-center justify-between">
                <div className="text-2xl font-normal"> {apiKey.name} </div>
              </div>
              <div className="w-1/2 flex flex-col">
                <Slug text={apiKey.slug} />
              </div>
            </div>
            <div className='flex flex-row items-center justify-between'>
              <div className="text-sm font-medium"> {apiKey.preview} </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-xs font-bold py-0.5 px-1 rounded-md flex items-center justify-center gap-1 bg-[#5A5A5A]">
                      <CrownSVG />
                      {apiKey.authorities.length}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="border-none bg-[#3F3F46] rounded text-white font-bold text-sm">
                    <p>Show Attributes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

            </div>
          </div>
          <div className="flex flex-row justify-between items-end rounded-b-xl bg-white/[6%] px-6 py-4 text-sm text-white/50">
            <div className="flex flex-col items-start text-sm font-medium">
              <div>Created on</div>
              <div>
                {dayjs(apiKey.createdAt).format('D MMMM, YYYY')}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div>{apiKey.expiresAt === null ? "Never" : "Expiring in"}</div>
              <div>
                {apiKey.expiresAt ? (
                  dayjs(apiKey.expiresAt).diff(dayjs(), "day") >= 1 ? (
                    `${dayjs(apiKey.expiresAt).diff(dayjs(), "day")} days`
                  ) : (
                    `${dayjs(apiKey.expiresAt).diff(dayjs(), "hour")} hours`
                  )
                ) : "Expiring"}
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
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
