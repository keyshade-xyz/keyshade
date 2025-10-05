import type { Integration, Workspace } from '@keyshade/schema'
import Link from 'next/link'
import React from 'react'

interface ProjectEnvironmentListProps {
  selectedIntegration: Integration
  currentWorkspace: Workspace
}

function ProjectEnvironmentList({
  selectedIntegration,
  currentWorkspace
}: ProjectEnvironmentListProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mr-4 flex flex-col gap-2 pb-4">
        <h2 className="text-xl font-semibold text-white">
          Project & environments details
        </h2>
        <p className="text-sm text-white/60">
          This integration is linked to the project below and the following
          environments.
        </p>
      </div>
      <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
        {!selectedIntegration.project?.slug ? (
          <div>
            <p className="text-sm text-white/60">Project and Environment</p>
            <p className="text-lg font-medium text-white">
              Listening for events from the entire workspace (no specific project or environment selected)
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-white/60">Project Name</p>
              <Link
                href={`/${currentWorkspace.slug}/${selectedIntegration.project.slug}?tab=overview`}
              >
                <span className="text-lg font-medium text-white underline hover:text-white/80">
                  {selectedIntegration.project.name}
                </span>
              </Link>
            </div>
            <div>
              <p className="text-sm text-white/60">Environments</p>
              {!selectedIntegration.environments ||
              selectedIntegration.environments.length === 0 ? (
                <span className="pt-2 text-lg font-medium text-white">
                  All environments
                </span>
              ) : (
                <span className="flex flex-wrap gap-2 pt-2">
                  {selectedIntegration.environments.map((env) => (
                    <Link
                      className="inline-flex items-center rounded-md border border-white/20 bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/80"
                      href={`/${currentWorkspace.slug}/${selectedIntegration.project?.slug}?tab=environment`}
                      key={env.id}
                    >
                      {env.name}
                    </Link>
                  ))}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectEnvironmentList
