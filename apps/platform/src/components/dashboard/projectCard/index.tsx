'use client'
// import { ThreeDotOptionSVG } from '@public/svg/shared'
import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import Avvvatars from 'avvvatars-react'
import { ConfigSVG, EnvironmentSVG, SecretSVG } from '@public/svg/dashboard'
import type { ProjectWithCount } from '@keyshade/schema'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

interface ProjectCardProps {
  project: ProjectWithCount
  setIsSheetOpen: Dispatch<SetStateAction<boolean>>
}

function ProjectCard({
  project,
  setIsSheetOpen
}: ProjectCardProps): JSX.Element {
  const {
    id,
    name,
    description,
    environmentCount,
    secretCount,
    variableCount
  } = project

  const copyToClipboard = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is checked
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(`${window.location.origin}/project/${name}`)
        .then(() => {
          toast.success('Link has been copied to clipboard.')
        })
        .catch((error) => {
          // eslint-disable-next-line no-console -- console.error is used for debugging
          console.error('Error copying text: ', error)
        })
    } else {
      // Fallback for browsers that don't support the Clipboard API
      // eslint-disable-next-line no-console -- console.log is used for debugging
      console.log('Clipboard API not supported')

      const textarea = document.createElement('textarea')
      textarea.value = `${window.location.origin}/project/${name}`
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        toast.success('Link has been copied to clipboard.')
      } catch (error) {
        // eslint-disable-next-line no-console -- console.error is used for debugging
        console.error('Error copying text: ', error)
      }
      document.body.removeChild(textarea)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[7rem]">
        <Link
          className="flex h-[7rem] w-full justify-between rounded-xl bg-white/5 px-5 py-4 shadow-lg hover:bg-white/10"
          href={`/project/${id}?tab=Secret`}
          key={id}
        >
          <div className="flex items-center gap-x-5">
            {/* <div className="aspect-square h-14 w-14 rounded-full bg-white/35" /> */}
            <Avvvatars size={56} style="shape" value={id} />
            <div>
              <div className="font-semibold">{name}</div>
              <span className="text-xs font-semibold text-white/60">
                {description}
              </span>
            </div>
          </div>
          <div className="flex h-full flex-col items-end justify-end">
            <div className="grid grid-cols-3 gap-x-3">
              <div className="flex items-center gap-x-1">
                <EnvironmentSVG />
                {environmentCount}
              </div>
              <div className="flex items-center gap-x-1">
                <ConfigSVG />
                {variableCount}
              </div>
              <div className="flex items-center gap-x-1">
                <SecretSVG />
                {secretCount}
              </div>
            </div>
          </div>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <Link href={`/project/${name}`}>
          <ContextMenuItem inset>Open</ContextMenuItem>
        </Link>
        <a href={`/project/${name}`} rel="noopener noreferrer" target="_blank">
          <ContextMenuItem inset>Open in new tab</ContextMenuItem>
        </a>
        <ContextMenuSeparator className="bg-white/15" />
        <ContextMenuItem
          inset
          onClick={() => {
            copyToClipboard()
          }}
        >
          Copy link
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/15" />
        <ContextMenuItem
          inset
          onClick={() => {
            setIsSheetOpen(true)
          }}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem inset>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default ProjectCard
