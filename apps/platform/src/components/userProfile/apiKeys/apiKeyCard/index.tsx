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
          <div className="flex flex-col gap-y-2 px-6 py-4">
            <div className="flex w-full flex-row items-center justify-between">
              <div className="text-xl"> {apiKey.name} </div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-end rounded-b-xl bg-white/[6%] px-6 py-4 text-sm text-white/50">
            <div className="w-1/2 flex flex-col">
              <Slug text={apiKey.slug} />
            </div>
            <div className="flex flex-col items-end">
              <div>Expiring in</div>
              <div>
                {apiKey.expiresAt ? (
                  dayjs(apiKey.expiresAt).diff(dayjs(), "day") >= 1 ? (
                    `${dayjs(apiKey.expiresAt).diff(dayjs(), "day")} days`
                  ) : (
                    `${dayjs(apiKey.expiresAt).diff(dayjs(), "hour")} hours`
                  )
                ) : "Never"}
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
