'use client'
import { useEffect, useState } from 'react'
import { LockSVG } from '@public/svg/shared'
import { useAtom, useAtomValue } from 'jotai'
import { EnvironmentSVG, SecretSVG, VariableSVG } from '@public/svg/dashboard'
import Avvvatars from 'avvvatars-react'
import Link from 'next/link'
import OverviewLoader from '@/components/dashboard/overview/overviewLoader'
import {
  selectedProjectPrivateKeyAtom,
  selectedProjectAtom,
  localProjectPrivateKeyAtom,
  viewAndDownloadProjectKeysOpenAtom
} from '@/store'
import LocalKeySetup from '@/components/dashboard/overview/LocalKeySetup'
import ServerKeySetup from '@/components/dashboard/overview/ServerKeySetup'
import SetupLocalKeyDialog from '@/components/dashboard/overview/SetupLocalKeyDialog'
import ServerKeySetupDialog from '@/components/dashboard/overview/ServerKeySetupDialog'
import RegenerateKeyDialog from '@/components/dashboard/overview/RegenerateKeyDialog'
import RegenerateKeySetup from '@/components/dashboard/overview/RegenerateKeySetup'
import WarningCard from '@/components/shared/warning-card'
import { formatDate } from '@/lib/utils'
import AvatarComponent from '@/components/common/avatar'
import InformationCard from '@/components/shared/information-card'
import ConfirmDeleteKeyDialog from '@/components/dashboard/overview/confirmDeleteKey'
import ViewAndDownloadProjectKeysDialog from '@/components/dashboard/project/viewAndDownloadKeysDialog'

function OverviewPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const [privateKey, setPrivateKey] = useAtom(selectedProjectPrivateKeyAtom)
  const localKeys = useAtomValue(localProjectPrivateKeyAtom)
  const [showAddLocalKeyDialog, setShowAddLocalKeyDialog] = useState(false)
  const [isKeyStoredOnServer, setIsKeyStoredOnServer] = useState(false)
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [showRegenerateKeyDialog, setShowRegenerateKeyDialog] = useState(false)
  const [showDeleteKeyDialog, setShowDeleteKeyDialog] = useState(false)
  const [
    isViewAndDownloadProjectKeysDialogOpen,
    setIsViewAndDownloadProjectKeysDialogOpen
  ] = useAtom(viewAndDownloadProjectKeysOpenAtom)
  const [regeneratedKeys, setRegeneratedKeys] = useState<{
    projectName: string
    storePrivateKey: boolean
    keys: { publicKey: string; privateKey: string }
  }>()

  useEffect(() => {
    const localKey =
      selectedProject &&
      localKeys.find((pair) => pair.slug === selectedProject.slug)?.key
    const key =
      (selectedProject?.storePrivateKey && selectedProject.privateKey) ||
      localKey ||
      null
    setPrivateKey(key)
    setIsKeyStoredOnServer(
      Boolean(selectedProject?.storePrivateKey && selectedProject.privateKey)
    )
    setIsLoading(false)
  }, [selectedProject, localKeys, setPrivateKey])

  useEffect(() => {
    if (regeneratedKeys) {
      setIsViewAndDownloadProjectKeysDialogOpen(true)
    }
  }, [regeneratedKeys, setIsViewAndDownloadProjectKeysDialogOpen])

  if (isLoading || !selectedProject) {
    return (
      <div className="space-y-4">
        <OverviewLoader />
        <OverviewLoader />
        <OverviewLoader />
      </div>
    )
  }

  return (
    <div className="flex w-full gap-5 pt-2">
      <div className="flex-1 rounded-md bg-white/5 p-6 drop-shadow-[0px_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex items-start justify-between pb-5">
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avvvatars size={50} style="shape" value={selectedProject.id} />
                <p className="text-2xl font-bold">{selectedProject.name}</p>
              </div>
              <div className="flex flex-col items-end justify-end gap-y-2 pt-2 text-white/60">
                <div className="flex flex-row items-center justify-center gap-x-2 text-xs">
                  <span>Last updated by</span>
                  <AvatarComponent
                    name={selectedProject.lastUpdatedBy.name}
                    profilePictureUrl={
                      selectedProject.lastUpdatedBy.profilePictureUrl
                    }
                  />
                  <span className="font-semibold text-white/90">
                    {selectedProject.lastUpdatedBy.name}
                  </span>
                </div>
                <div className="flex flex-row justify-end gap-x-1 text-xs">
                  <span>on</span>
                  <span className="font-semibold text-white/90">
                    {formatDate(
                      selectedProject.updatedAt || selectedProject.createdAt
                    )}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-white/70">{selectedProject.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Link
            className="flex flex-1 items-start justify-between rounded-lg bg-white/10 p-5 hover:bg-white/5 "
            href={`${selectedProject.slug}?tab=secret`}
          >
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">Secrets</p>
              <p className="text-sm text-white/60">
                See all the secrets of the project!
              </p>
            </div>
            <div className="flex gap-2 rounded-lg bg-black/40 p-2">
              <SecretSVG width={16} />
              {selectedProject.secretCount}
            </div>
          </Link>

          <Link
            className="flex flex-1 items-start justify-between rounded-lg bg-white/10 p-5 hover:bg-white/5"
            href={`${selectedProject.slug}?tab=variable`}
          >
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">Variables</p>
              <p className="text-sm text-white/60">
                See all the variables of the project!
              </p>
            </div>
            <div className="flex gap-2 rounded-lg bg-[#262626] p-2">
              <VariableSVG width={16} />
              {selectedProject.variableCount}
            </div>
          </Link>

          <Link
            className="flex flex-1 items-start justify-between rounded-lg bg-white/10 p-5 hover:bg-white/5"
            href={`${selectedProject.slug}?tab=environment`}
          >
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">Environments</p>
              <p className="text-sm text-white/60">
                See all the environments of the project!
              </p>
            </div>
            <div className="flex gap-2 rounded-lg bg-[#262626] p-2">
              <EnvironmentSVG width={16} />
              {selectedProject.environmentCount}
            </div>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 rounded-md bg-white/5 p-6 drop-shadow-[0px_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex items-center gap-x-2 border-b border-white/20 pb-5">
          <LockSVG />
          <p className="text-lg font-bold">Security Settings</p>
        </div>

        {privateKey ? (
          <InformationCard>
            We are using your private key from{' '}
            {isKeyStoredOnServer ? 'database' : 'browser'}
          </InformationCard>
        ) : (
          <WarningCard>
            You have not stored any private key with us, so secret values can
            not be decrypted
          </WarningCard>
        )}

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="items-center text-xl font-semibold">
                Set up private key in memory?
              </p>

              <p className="text-sm text-white/60">
                Storing your private key in the memory is the safest way to
                browse through the secrets of your project. It gets stored in
                your browser&apos;s state, and never makes it to any persistent
                store.
              </p>
            </div>
            <LocalKeySetup
              isStoredOnServer={isKeyStoredOnServer}
              onDelete={() => setShowDeleteKeyDialog(true)}
              onOpenSetupDialog={() => setShowAddLocalKeyDialog(true)}
              privateKey={privateKey}
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-xl font-semibold">
                Do you want to regenerate the private key?
              </p>
              <p className="text-sm text-white/60">
                Re-encrypts all your secrets with a new private key. If your
                current key is compromised, this ensures your security.
              </p>
            </div>
            <RegenerateKeySetup
              onOpenRegenerateDialog={() => setShowRegenerateKeyDialog(true)}
              onRegenerated={(keys) => setRegeneratedKeys(keys)}
              privateKey={privateKey}
              projectSlug={selectedProject.slug}
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-xl font-semibold">
                Store private key with us?
              </p>
              <p className="ext-sm text-white/60">
                This allows you and your team to access project secrets without
                setup, making collaboration easier. However, it also increases
                the risk of accidental leaks.
              </p>
            </div>
            <ServerKeySetup
              isStoredOnServer={isKeyStoredOnServer}
              onDelete={() => setShowDeleteKeyDialog(true)}
              onKeyStored={() => setIsKeyStoredOnServer(true)}
              onOpenStoreDialog={() => setShowAddKeyDialog(true)}
              privateKey={privateKey}
              projectSlug={selectedProject.slug}
            />
          </div>
        </div>
      </div>

      <SetupLocalKeyDialog
        currentProject={selectedProject.slug}
        isOpen={showAddLocalKeyDialog}
        onClose={() => setShowAddLocalKeyDialog(false)}
      />
      <ServerKeySetupDialog
        currentProjectSlug={selectedProject.slug}
        isOpen={showAddKeyDialog}
        onClose={() => setShowAddKeyDialog(false)}
      />
      <RegenerateKeyDialog
        currentProjectSlug={selectedProject.slug}
        isOpen={showRegenerateKeyDialog}
        onClose={() => setShowRegenerateKeyDialog(false)}
        onRegenerated={(keys) => setRegeneratedKeys(keys)}
      />
      <ConfirmDeleteKeyDialog
        currentProject={selectedProject.slug}
        isOpen={showDeleteKeyDialog}
        isStoredOnServer={isKeyStoredOnServer}
        onClose={() => setShowDeleteKeyDialog(false)}
      />
      {isViewAndDownloadProjectKeysDialogOpen ? (
        <ViewAndDownloadProjectKeysDialog projectKeys={regeneratedKeys} />
      ) : null}
    </div>
  )
}

export default OverviewPage
