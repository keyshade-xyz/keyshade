import React from 'react'
import type { WorkspaceRole } from '@keyshade/schema'
import { TableCell } from '@/components/ui/table'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

function ProjectsAndEnvironmentsTooltip({
  projectsAndEnvironments
}: {
  projectsAndEnvironments: WorkspaceRole['projects']
}) {
  return projectsAndEnvironments.length > 0 ? (
    <div className="px-5 text-sm">
      {projectsAndEnvironments.map(({ project, environments }) => (
        <li key={project.id}>
          {project.name}{' '}
          {environments.length > 0
            ? `(${environments.map((env) => env.name).join(', ')})`
            : ''}
        </li>
      ))}
    </div>
  ) : (
    <span className="text-sm text-white/60">
      No projects and environments associated with this role
    </span>
  )
}

interface RoleProjectEnvironmentCellProps {
  projects: WorkspaceRole['projects']
}

function RoleProjectEnvironmentCell({
  projects
}: RoleProjectEnvironmentCellProps) {
  return (
    <TableCell className="h-fit cursor-pointer text-sm text-white/60 underline">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="flex h-full items-start justify-start">
            {projects.length} projects,{' '}
            {projects.reduce((a, b) => a + b.environments.length, 0)}{' '}
            environments
          </TooltipTrigger>
          <TooltipContent
            className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
            sideOffset={8}
          >
            <ProjectsAndEnvironmentsTooltip
              projectsAndEnvironments={projects}
            />
            <TooltipArrow className="fill-zinc-700" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  )
}

export default RoleProjectEnvironmentCell
