import React from 'react'
import ImportEnvButton from './import-env-button'

function ImportEnvContainer({ projectSlug }): React.JSX.Element {
  return (
    <div className="flex h-fit justify-between gap-1 rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-white">
          Import your configurations
        </h1>
        <p className="text-sm text-white/60">
          Transfer your .env file from your computer into this project
        </p>
      </div>
      <ImportEnvButton projectSlug={projectSlug} />
    </div>
  )
}

export default ImportEnvContainer
