'use client'
import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { LockSVG } from '@public/svg/shared'
import OverviewLoader from '@/components/dashboard/overview/overviewLoader'
import {
  selectedProjectAtom,
  viewAndDownloadProjectKeysOpenAtom
} from '@/store'
import LocalKeySetup from '@/components/dashboard/overview/LocalKeySetup'
import ServerKeySetup from '@/components/dashboard/overview/ServerKeySetup'
import SetupLocalKeyDialog from '@/components/dashboard/overview/SetupLocalKeyDialog'
import ServerKeySetupDialog from '@/components/dashboard/overview/ServerKeySetupDialog'
import RegenerateKeyDialog from '@/components/dashboard/overview/RegenerateKeyDialog'
import RegenerateKeySetup from '@/components/dashboard/overview/RegenerateKeySetup'
import ConfirmDeleteKeyDialog from '@/components/dashboard/overview/confirmDeleteKey'
import ViewAndDownloadProjectKeysDialog from '@/components/dashboard/project/viewAndDownloadKeysDialog'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import { PageTitle } from '@/components/common/page-title'
import ImportEnvButton from '@/components/dashboard/overview/ImportEnv'
import ConfigAccessLevel from '@/components/dashboard/overview/ConfigAccessLevel'
import { TooltipProvider } from '@/components/ui/tooltip'
import KeyshadeDocs from '@/components/dashboard/overview/AboutKeyshade'
import ProjectDetails from '@/components/dashboard/overview/ProjectDetails'

function OverviewPage(): React.JSX.Element {
  const selectedProject = useAtomValue(selectedProjectAtom)
  const [
    isViewAndDownloadProjectKeysDialogOpen,
    setIsViewAndDownloadProjectKeysDialogOpen
  ] = useAtom(viewAndDownloadProjectKeysOpenAtom)
  const [localKeyDialogOpen, setLocalKeyDialogOpen] = useState<boolean>(false)
  const [serverKeyDialogOpen, setServerKeyDialogOpen] = useState<boolean>(false)
  const [regenerateKeyDialogOpen, setRegenerateKeyDialogOpen] =
    useState<boolean>(false)
  const [deleteKeyDialogOpen, setDeleteKeyDialogOpen] = useState<boolean>(false)
  const [regeneratedKeys, setRegeneratedKeys] = useState<{
    projectName: string
    storePrivateKey: boolean
    keys: { publicKey: string; privateKey: string }
  }>()
  const { projectPrivateKey, loading } = useProjectPrivateKey(selectedProject)

  useEffect(() => {
    if (regeneratedKeys) {
      setIsViewAndDownloadProjectKeysDialogOpen(true)
    }
  }, [regeneratedKeys, setIsViewAndDownloadProjectKeysDialogOpen])

  if (loading || !selectedProject) {
    return (
      <div className="space-y-4">
        <OverviewLoader />
        <OverviewLoader />
        <OverviewLoader />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full gap-4 pt-2">
      <PageTitle title={`${selectedProject.name} | Overview`} />
      <div className="flex h-fit w-[55%] flex-col gap-4">
        {/* Basic project details eg:name , des... */}
        <ProjectDetails project={selectedProject} />

        {/* Import .env feature */}
        <ImportEnvButton projectSlug={selectedProject.slug} />

        {/* update project access level */}
        <ConfigAccessLevel
          accessLevel={selectedProject.accessLevel}
          projectSlug={selectedProject.slug}
        />
      </div>

      <div className="flex h-fit w-[45%] flex-col gap-4">
        <div className="flex h-fit w-full flex-col gap-3 rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
          <div className="flex items-center gap-x-2 border-b border-white/20 pb-5">
            <LockSVG />
            <p className="text-lg font-bold">Security Settings</p>
          </div>
          <div className="flex h-full flex-col gap-4 ">
            <TooltipProvider>
              {/* Setup privatekey in atom */}
              <LocalKeySetup
                onDelete={() => setDeleteKeyDialogOpen(true)}
                onOpenSetupDialog={() => setLocalKeyDialogOpen(true)}
                privateKey={projectPrivateKey}
              />

              {/* Regenerate private key */}
              <RegenerateKeySetup
                onOpenRegenerateDialog={() => setRegenerateKeyDialogOpen(true)}
                onRegenerated={(keys) => setRegeneratedKeys(keys)}
                privateKey={projectPrivateKey}
                projectSlug={selectedProject.slug}
              />

              {/* store private key in keyshade db */}
              <ServerKeySetup
                onDelete={() => setDeleteKeyDialogOpen(true)}
                onOpenStoreDialog={() => setServerKeyDialogOpen(true)}
                privateKey={projectPrivateKey}
                projectSlug={selectedProject.slug}
              />
            </TooltipProvider>
          </div>
        </div>

        {/* Link to docs */}
        <KeyshadeDocs />
      </div>
      {/* Local key setup dialog */}
      <SetupLocalKeyDialog
        currentProject={selectedProject.slug}
        isOpen={localKeyDialogOpen}
        onClose={() => setLocalKeyDialogOpen(false)}
      />

      {/* Server key setup dialog */}
      <ServerKeySetupDialog
        currentProjectSlug={selectedProject.slug}
        isOpen={serverKeyDialogOpen}
        onClose={() => setServerKeyDialogOpen(false)}
      />

      {/* Regenerate key dialog */}
      <RegenerateKeyDialog
        currentProjectSlug={selectedProject.slug}
        isOpen={regenerateKeyDialogOpen}
        onClose={() => setRegenerateKeyDialogOpen(false)}
        onRegenerated={(keys) => setRegeneratedKeys(keys)}
      />

      {/* Delete secret alert dialog */}
      <ConfirmDeleteKeyDialog
        currentProject={selectedProject.slug}
        isOpen={deleteKeyDialogOpen}
        onClose={() => setDeleteKeyDialogOpen(false)}
      />
      {/* View and download project keys dialog */}
      {isViewAndDownloadProjectKeysDialogOpen ? (
        <ViewAndDownloadProjectKeysDialog
          isCreated={false}
          projectKeys={regeneratedKeys}
          projectSlug={selectedProject.slug}
        />
      ) : null}
    </div>
  )
}

export default OverviewPage
