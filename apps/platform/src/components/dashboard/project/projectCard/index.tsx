'use client'
import Link from 'next/link'
import Avvvatars from 'avvvatars-react'
import type { GetAllProjectsResponse } from '@keyshade/schema'
import { useAtomValue, useSetAtom } from 'jotai'
import { SecretSVG, EnvironmentSVG, VariableSVG } from '@public/svg/dashboard'
import { MoreHorizontalIcon } from 'lucide-react'
import ProjectContextMenu from './project-context-menu'
import ProjectDropdownMenu from './project-dropdown-menu'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import {
  deleteProjectOpenAtom,
  editProjectOpenAtom,
  exportConfigOpenAtom,
  selectedProjectAtom,
  selectedWorkspaceAtom
} from '@/store'
import { copyToClipboard } from '@/lib/clipboard'
import { ProjectTag } from '@/components/ui/project-tag'
import { GeistSansFont } from '@/fonts'
import {
  DropdownMenu,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface ProjectCardProps {
  project: GetAllProjectsResponse['items'][number]
}

export default function ProjectCard({
  project
}: ProjectCardProps): JSX.Element {
  const {
    id,
    slug,
    name,
    description,
    totalEnvironments,
    totalVariables,
    totalSecrets,
    accessLevel,
    entitlements
  } = project

  const setIsEditProjectSheetOpen = useSetAtom(editProjectOpenAtom)
  const setIsDeleteProjectOpen = useSetAtom(deleteProjectOpenAtom)
  const setSelectedProject = useSetAtom(selectedProjectAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const setIsExportConfigurationDialogOpen = useSetAtom(exportConfigOpenAtom)

  const isAuthorizedToEditProjects = entitlements.canUpdate
  const isAuthorizedToDeleteProjects = entitlements.canDelete

  const handleCopyToClipboard = () => {
    copyToClipboard(
      slug,
      'You copied the slug successfully.',
      'Unable to copy slug.',
      'You successfully copied the slug.',
      'Something went wrong while copying the slug.'
    )
  }

  const handleEditProject = () => {
    setSelectedProject(project)
    setIsEditProjectSheetOpen(true)
  }

  const handleDeleteProject = () => {
    setSelectedProject(project)
    setIsDeleteProjectOpen(true)
  }

  const handleExportConfiguration = () => {
    setSelectedProject(project)
    setIsExportConfigurationDialogOpen(true)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-28">
        <Link
          className={`${GeistSansFont.className} bg-night-c hover:bg-night-b border-white/8 flex h-fit w-full flex-col justify-between gap-y-10 rounded-lg border p-4 shadow-lg`}
          href={`${selectedWorkspace?.slug}/${slug}?tab=overview`}
          key={id}
        >
          <div className="flex justify-between">
            <div className="flex min-w-0 items-center gap-x-2">
              <div className="shrink-0">
                <Avvvatars radius={4} size={40} style="shape" value={id} />
              </div>
              <div className="flex min-w-0 flex-col overflow-hidden">
                <div className="w-[199px] truncate text-base font-semibold">
                  {name}
                </div>
                <span className="line-clamp-2 w-[199px] truncate break-words text-sm text-white/60">
                  {description}
                </span>
              </div>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  type="button"
                >
                  <MoreHorizontalIcon />
                </button>
              </DropdownMenuTrigger>
              <ProjectDropdownMenu
                copyToClipboard={copyToClipboard}
                handleCopyToClipboard={handleCopyToClipboard}
                handleDeleteProject={handleDeleteProject}
                handleEditProject={handleEditProject}
                handleExportConfiguration={handleExportConfiguration}
                isAuthorizedToDeleteProjects={isAuthorizedToDeleteProjects}
                isAuthorizedToEditProjects={isAuthorizedToEditProjects}
                selectedWorkspace={selectedWorkspace!}
                slug={slug}
              />
            </DropdownMenu>
          </div>

          <div className="flex h-full items-end justify-between">
            <div className="grid grid-cols-3 gap-x-3">
              <div className="flex items-center gap-x-1">
                <EnvironmentSVG width={16} />
                {totalEnvironments}
              </div>
              <div className="flex items-center gap-x-1">
                <VariableSVG width={16} />
                {totalVariables}
              </div>
              <div className="flex items-center gap-x-1">
                <SecretSVG width={16} />
                {totalSecrets}
              </div>
            </div>
            <ProjectTag
              variant={
                accessLevel.toLowerCase() as 'private' | 'internal' | 'global'
              }
            />
          </div>
        </Link>
      </ContextMenuTrigger>
      <ProjectContextMenu
        copyToClipboard={copyToClipboard}
        handleCopyToClipboard={handleCopyToClipboard}
        handleDeleteProject={handleDeleteProject}
        handleEditProject={handleEditProject}
        handleExportConfiguration={handleExportConfiguration}
        isAuthorizedToDeleteProjects={isAuthorizedToDeleteProjects}
        isAuthorizedToEditProjects={isAuthorizedToEditProjects}
        selectedWorkspace={selectedWorkspace!}
        slug={slug}
      />
    </ContextMenu>
  )
}
