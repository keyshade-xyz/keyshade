import React from 'react'
import ShareProjectButton from './share-project-button'

export default function ShareProjectContainer({ projectSlug }: { projectSlug: string }): React.JSX.Element {
  return (
    <div className="flex h-fit justify-between gap-1 rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-white">
          Share Project Access
        </h1>
        <p className="text-sm text-white/60">
          Generate a one-time view link and securely share it with a team member.
        </p>
      </div>
      <ShareProjectButton projectSlug={projectSlug} />
    </div>
  )
}