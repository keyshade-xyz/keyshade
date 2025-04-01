'use client'
import { useEffect, useState } from 'react'
import { LockSVG } from '@public/svg/shared'
import { useAtom, useAtomValue } from 'jotai'
import { SecretSVG } from '@public/svg/dashboard'
import dayjs from 'dayjs'
import Avvvatars from 'avvvatars-react'
import OverviewLoader from '@/components/dashboard/overview/overviewLoader'
import { selectedProjectPrivateKeyAtom, selectedProjectAtom } from '@/store'
import LocalKeySetup from '@/components/dashboard/overview/LocalKeySetup'
import ServerKeySetup from '@/components/dashboard/overview/ServerKeySetup'
import SetupLocalKeyDialog from '@/components/dashboard/overview/SetupLocalKeyDialog'
import ServerKeySetupDialog from '@/components/dashboard/overview/ServerKeySetupDialog'
import RegenerateKeyDialog from '@/components/dashboard/overview/RegenerateKeyDialog'
import RegenerateKeySetup from '@/components/dashboard/overview/RegenerateKeySetup'

function OverviewPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const [privateKey, setPrivateKey] = useAtom(selectedProjectPrivateKeyAtom)
  const [showAddLocalKeyDialog, setShowAddLocalKeyDialog] = useState(false)
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [showRegenerateKeyDialog, setShowRegenerateKeyDialog] = useState(false)

  useEffect(() => {
    const key = selectedProject?.storePrivateKey
      ? selectedProject.privateKey
      : localStorage.getItem(`${selectedProject?.slug}_pk`) || null

    setPrivateKey(key)
    setIsLoading(false)
  }, [selectedProject, setPrivateKey])

  const isKeyStoredOnServer = Boolean(
    selectedProject?.storePrivateKey && selectedProject.privateKey
  )

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
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Avvvatars size={50} style="shape" value={selectedProject.id} />
              <p className="text-2xl font-bold">{selectedProject.name}</p>
            </div>
            <div className="text-base">{selectedProject.description}</div>
          </div>

          <div className="rounded-md bg-white/10 p-1.5 text-xs text-white">
            {dayjs(selectedProject.updatedAt).toNow(true)} ago
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-1 items-start justify-between rounded-lg bg-white/10 p-5 ">
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
          </div>

          <div className="flex flex-1 items-start justify-between rounded-lg bg-white/10 p-5 ">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">Variables</p>
              <p className="text-sm text-white/60">
                See all the variables of the project!
              </p>
            </div>
            <div className="flex gap-2 rounded-lg bg-[#262626] p-2">
              <SecretSVG width={16} />
              {selectedProject.variableCount}
            </div>
          </div>

          <div className="flex flex-1 items-start justify-between rounded-lg bg-white/10 p-5 ">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">Environments</p>
              <p className="text-sm text-white/60">
                See all the environments of the project!
              </p>
            </div>
            <div className="flex gap-2 rounded-lg bg-[#262626] p-2">
              <SecretSVG width={16} />
              {selectedProject.environmentCount}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 rounded-md bg-white/5 p-6 drop-shadow-[0px_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex items-center gap-x-2 border-b border-white/20 pb-5">
          <LockSVG />
          <p className="text-lg font-bold">Security Settings</p>
        </div>

        {!privateKey && (
          <div className="flex  items-center justify-center rounded-lg border border-yellow-300 p-2.5">
            <p className="font-semibold text-yellow-300">
              You have not stored any private key with us, so secret values can
              not be decrypted.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">
                Do you want to setup private key?
              </p>
              <p className="text-sm text-white/60">
                Storing your private key in the browser is the safest way to
                browse through the secrets of your project
              </p>
            </div>
            <LocalKeySetup
              isStoredOnServer={isKeyStoredOnServer}
              onOpenSetupDialog={() => setShowAddLocalKeyDialog(true)}
              privateKey={privateKey}
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">
                Do you want to regenerate the private key?
              </p>
              <p className="text-sm text-white/60">
                Re-encrypts all your secrets with a new private key. If your
                current key is compromised, this ensures your security.
              </p>
            </div>
            <RegenerateKeySetup
              onOpenRegenerateDialog={() => setShowRegenerateKeyDialog(true)}
              privateKey={privateKey}
              projectSlug={selectedProject.slug}
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">
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
      />
    </div>
  )
}

export default OverviewPage
