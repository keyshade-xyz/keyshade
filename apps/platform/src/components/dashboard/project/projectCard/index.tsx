'use client'
import Link from 'next/link'
import { toast } from 'sonner'
import Avvvatars from 'avvvatars-react'
import {
  SecretSVG,
  EnvironmentSVG,
  VariableSVG,
  GlobalSVG,
  PrivateSVG,
  InternalSVG
} from '@public/svg/dashboard'
import type { ProjectWithCount } from '@keyshade/schema'
import { useSetAtom } from 'jotai'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  deleteProjectOpenAtom,
  editProjectOpenAtom,
  selectedProjectAtom
} from '@/store'

interface ProjectCardProps {
  project: ProjectWithCount
}

export default function ProjectCard({
  project
}: ProjectCardProps): JSX.Element {
  const {
    id,
    slug,
    name,
    description,
    environmentCount,
    secretCount,
    variableCount,
    accessLevel
  } = project

  const setIsEditProjectSheetOpen = useSetAtom(editProjectOpenAtom)
  const setIsDeleteProjectOpen = useSetAtom(deleteProjectOpenAtom)
  const setSelectedVariable = useSetAtom(selectedProjectAtom)

  const copyToClipboard = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is checked
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(`${window.location.origin}/project/${slug}`)
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
      textarea.value = `${window.location.origin}/project/${slug}`
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

  const handleDeleteProject = () => {
    setSelectedVariable(project)
    setIsDeleteProjectOpen(true)
  }

  const accessLevelToSVG = (accessLvl: ProjectWithCount['accessLevel']) => {
    switch (accessLvl) {
      case 'GLOBAL':
        return <GlobalSVG width={16} />
      case 'PRIVATE':
        return <PrivateSVG width={16} />
      case 'INTERNAL':
        return <InternalSVG width={16} />
      default:
        return null
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[7rem]">
        <Link
          className="flex h-[7rem] w-full justify-between rounded-xl bg-white/5 px-5 py-4 shadow-lg hover:bg-white/10"
          href={`/project/${slug}?tab=Secret`}
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
          <div className="flex h-full flex-col items-end justify-between">
            <div className="flex items-center gap-1 rounded-md border border-white/70 px-2 py-1 capitalize">
              {accessLevelToSVG(accessLevel)}
              {accessLevel.toLowerCase()}
            </div>
            <div className="grid grid-cols-3 gap-x-3">
              <div className="flex items-center gap-x-1">
                <EnvironmentSVG width={16} />
                {environmentCount}
              </div>
              <div className="flex items-center gap-x-1">
                <VariableSVG width={16} />
                {variableCount}
              </div>
              <div className="flex items-center gap-x-1">
                <SecretSVG width={16} />
                {secretCount}
              </div>
            </div>
          </div>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <Link href={`/project/${slug}`}>
          <ContextMenuItem inset>Open</ContextMenuItem>
        </Link>
        <a href={`/project/${slug}`} rel="noopener noreferrer" target="_blank">
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
            setIsEditProjectSheetOpen(true)
          }}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem inset onClick={handleDeleteProject}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
