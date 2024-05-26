'use client'
// import { ThreeDotOptionSVG } from '@public/svg/shared'
import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import Avvvatars from 'avvvatars-react'
import { ConfigSVG, EnvironmentSVG, SecretSVG } from '@public/svg/dashboard'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

// import {
//   Menubar,
//   MenubarContent,
//   MenubarItem,
//   MenubarMenu,
//   MenubarSeparator,
//   MenubarTrigger
// } from '@/components/ui/menubar'

interface ProjectCardProps {
  idForImage: string
  key: number | string
  title: string
  description: string
  environment: number
  config: number
  secret: number
  setIsSheetOpen: Dispatch<SetStateAction<boolean>>
}

function ProjectCard({
  idForImage,
  key,
  title,
  description,
  environment,
  config,
  secret,
  setIsSheetOpen
}: ProjectCardProps): JSX.Element {
  const copyToClipboard = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is checked
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(`${window.location.origin}/project/${title}`)
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
      textarea.value = `${window.location.origin}/project/${title}`
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
      <ContextMenuTrigger className='flex h-[7rem]'>
        <Link
          className="flex h-[7rem] max-w-[30.25rem] justify-between rounded-xl bg-white/5 px-5 py-4 shadow-lg hover:bg-white/10"
          href={`/project/${title}`}
          key={key}
        >
          <div className="flex items-center gap-x-5">
            {/* <div className="aspect-square h-14 w-14 rounded-full bg-white/35" /> */}
            <Avvvatars size={56} style='shape' value={idForImage} />
            <div>
              <div className="font-semibold">{title}</div>
              <span className="text-xs font-semibold text-white/60">
                {description}
              </span>
            </div>
          </div>
          <div className="flex h-full flex-col items-end justify-end">
            <div className="grid grid-cols-3 gap-x-3">
              <div className="flex items-center gap-x-1">
                <EnvironmentSVG />
                {environment}
              </div>
              <div className="flex items-center gap-x-1">
                <ConfigSVG />
                {config}
              </div>
              <div className="flex items-center gap-x-1">
                <SecretSVG />
                {secret}
              </div>
            </div>
          </div>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <Link href={`/project/${title}`}>
          <ContextMenuItem inset>Open</ContextMenuItem>
        </Link>
        <a href={`/project/${title}`} rel="noopener noreferrer" target="_blank">
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
