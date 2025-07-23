import type { Project } from '@keyshade/schema'
import Avvvatars from 'avvvatars-react'
import React from 'react'
import AvatarComponent from '@/components/common/avatar'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import { formatDate } from '@/lib/utils'

interface ProjectDetailsProps {
  project: Project
}

function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="h-fit w-full rounded-2xl bg-white/5 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
      <div className="flex items-start justify-between p-4">
        <div className="flex w-full gap-2">
          <Avvvatars size={40} style="shape" value={project.id} />
          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold">{project.name}</p>
            <p className="text-sm text-white/60">{project.description}</p>
          </div>
        </div>
        <CopyToClipboard text={project.slug} />
      </div>
      <div className="flex items-center gap-1 border-t border-white/20 p-4">
        <AvatarComponent
          className="mr-2 rounded-md"
          name={project.lastUpdatedBy.name}
          profilePictureUrl={project.lastUpdatedBy.profilePictureUrl}
        />
        <div className="flex-wrap text-sm text-white/60">
          last updated by{' '}
          <span className="font-semibold text-white">
            {project.lastUpdatedBy.name}
          </span>{' '}
          on <span>{formatDate(project.updatedAt || project.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
