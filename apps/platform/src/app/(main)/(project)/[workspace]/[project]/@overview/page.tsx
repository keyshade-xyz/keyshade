'use client'
import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import Avvvatars from 'avvvatars-react'
import { LockSVG } from '@public/svg/shared'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
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
import { formatDate } from '@/lib/utils'
import AvatarComponent from '@/components/common/avatar'
import ConfirmDeleteKeyDialog from '@/components/dashboard/overview/confirmDeleteKey'
import ViewAndDownloadProjectKeysDialog from '@/components/dashboard/project/viewAndDownloadKeysDialog'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import { PageTitle } from '@/components/common/page-title'
import CopySlug from '@/components/common/copy-slug'
import ImportEnvButton from '@/components/dashboard/overview/ImportEnv'
import ConfigAccessLevel from '@/components/dashboard/overview/ConfigAccessLevel'

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
  const {
    projectPrivateKey,
    hasServerStoredKey,
    setHasServerStoredKey,
    loading
  } = useProjectPrivateKey(selectedProject)

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
      <div className="flex min-h-full w-2/5 flex-col gap-4">
        <div className="h-fit w-full rounded-2xl bg-white/5 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
          <div className="flex items-start justify-between p-4">
            <div className="flex w-full gap-2">
              <Avvvatars size={40} style="shape" value={selectedProject.id} />
              <div className="flex flex-col gap-1">
                <p className="text-xl font-bold">{selectedProject.name}</p>
                <p className="text-sm text-white/60">
                  {selectedProject.description}
                </p>
              </div>
            </div>
            <CopySlug text={selectedProject.slug} />
          </div>
          <div className="flex items-center gap-1 border-t border-white/20 p-4">
            <AvatarComponent
              className="mr-2 rounded-md"
              name={selectedProject.lastUpdatedBy.name}
              profilePictureUrl={
                selectedProject.lastUpdatedBy.profilePictureUrl
              }
            />
            <div className="flex-wrap text-sm text-white/60">
              last updated by{' '}
              <span className="font-semibold text-white">
                {selectedProject.lastUpdatedBy.name}
              </span>{' '}
              on{' '}
              <span>
                {formatDate(
                  selectedProject.updatedAt || selectedProject.createdAt
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex h-fit w-full items-center justify-between gap-1 rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium text-white">
              Import your configurations
            </h1>
            <p className="text-sm text-white/60">
              Sync your local configurations in your projects with a click of a
              button
            </p>
          </div>
          <ImportEnvButton projectSlug={selectedProject.slug} />
        </div>

        <div className="h-fit w-full rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium text-white">
              Configure access level
            </h1>
            <p className="text-sm text-white/60">
              Control who can access this project by setting the appropriate
              visibility level.
            </p>
          </div>
          <ConfigAccessLevel
            accessLevel={selectedProject.accessLevel}
            projectSlug={selectedProject.slug}
          />
        </div>
      </div>
      <div className="flex min-h-full w-3/5 flex-col gap-4">
        <div className="flex h-fit w-full flex-col gap-3 rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
          <div className="flex items-center gap-x-2 border-b border-white/20 pb-5">
            <LockSVG />
            <p className="text-lg font-bold">Security Settings</p>
          </div>
          <div className="flex h-full flex-col gap-4 ">
            <div className="flex items-center justify-between gap-1.5 rounded-lg bg-white/10 p-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-medium text-white">
                  Do you wanna setup private key?
                </h1>
                <p className="text-sm text-white/60">
                  Settings up your private key in browser helps you with safely
                  setting up your secret.
                </p>
              </div>
              <LocalKeySetup
                isStoredOnServer={hasServerStoredKey}
                onDelete={() => setDeleteKeyDialogOpen(true)}
                onOpenSetupDialog={() => setLocalKeyDialogOpen(true)}
                privateKey={projectPrivateKey}
              />
            </div>
            <div className="flex  items-center justify-between gap-1.5 rounded-lg bg-white/10 p-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-medium text-white">
                  Do you wanna regenerate private key?
                </h1>
                <p className="text-sm text-white/60">
                  This will help you and your team to shared secrets easily.
                </p>
              </div>
              <RegenerateKeySetup
                onOpenRegenerateDialog={() => setRegenerateKeyDialogOpen(true)}
                onRegenerated={(keys) => setRegeneratedKeys(keys)}
                privateKey={projectPrivateKey}
                projectSlug={selectedProject.slug}
              />
            </div>
            <div className="flex items-center justify-between gap-1.5 rounded-lg bg-white/10 p-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-medium text-white">
                  Store private key with us?
                </h1>
                <p className="text-sm text-white/60">
                  This will help you and your team to shared secrets easily.
                </p>
              </div>
              <ServerKeySetup
                isStoredOnServer={hasServerStoredKey}
                onDelete={() => setDeleteKeyDialogOpen(true)}
                onKeyStored={() => setHasServerStoredKey(true)}
                onOpenStoreDialog={() => setServerKeyDialogOpen(true)}
                privateKey={projectPrivateKey}
                projectSlug={selectedProject.slug}
              />
            </div>
          </div>
        </div>
        <div className="flex h-fit w-full flex-col  rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium text-white">
              Learn about keyshade
            </h1>
            <p className="text-sm text-white/60">
              Project over view of this project..... <br />
              contains secrets of our core product, keep it very secure andsafe.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 py-4">
            <Link
              href="https://docs.keyshade.xyz/getting-started/adding-your-first-secret-and-variable"
              target="_blank"
            >
              <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
                <p>How to create secrets?</p>
                <ArrowUpRight className="h-18 w-18" />
              </div>
            </Link>

            <Link
              href="https://docs.keyshade.xyz/getting-started/adding-your-first-secret-and-variable"
              target="_blank"
            >
              <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
                <p>How to create variables?</p>
                <ArrowUpRight className="h-18 w-18" />
              </div>
            </Link>

            <Link
              href="https://docs.keyshade.xyz/getting-started/adding-your-first-secret-and-variable"
              target="_blank"
            >
              <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
                <p>How to create environments?</p>
                <ArrowUpRight className="h-18 w-18" />
              </div>
            </Link>

            <Link href="https://docs.keyshade.xyz" target="_blank">
              <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
                <p>Docs & help</p>
                <ArrowUpRight className="h-18 w-18" />
              </div>
            </Link>
          </div>
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
          isStoredOnServer={hasServerStoredKey}
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
    </div>
  )
}

export default OverviewPage
