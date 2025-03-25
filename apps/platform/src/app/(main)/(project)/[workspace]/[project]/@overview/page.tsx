'use client'
import { useEffect, useState } from 'react'
import { KeyshadeLogoSVG, LockSVG } from '@public/svg/shared'
import { useAtom, useAtomValue } from 'jotai'
import { SecretSVG } from '@public/svg/dashboard'
import OverviewLoader from '@/components/dashboard/overview/overviewLoader'
import RegenerateKey from '@/components/dashboard/overview/RegenerateKey'
import { projectPrivateKey, selectedProjectAtom } from '@/store'
import { formatTimeAgo } from '@/lib/utils'
import LocalKeySetup from '@/components/dashboard/overview/LocalKeySetup'
import ServerKeySetup from '@/components/dashboard/overview/ServerKeySetup'
import SetupLocalKeyDialog from '@/components/dashboard/overview/SetupLocalKeyDialog'

function OverviewPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const activeProject = useAtomValue(selectedProjectAtom)
  const [privateKey, setPrivateKey] = useAtom(projectPrivateKey)
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)

  useEffect(() => {
    const key = activeProject?.storePrivateKey
      ? activeProject.privateKey
      : localStorage.getItem(`${activeProject?.name}_pk`) || null

    setPrivateKey(key)
    setIsLoading(false)
  }, [activeProject, setPrivateKey])

  const isKeyStoredOnServer = Boolean(activeProject?.privateKey)

  if (isLoading || !activeProject) {
    return (
      <div className="space-y-4">
        <OverviewLoader />
        <OverviewLoader />
        <OverviewLoader />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full gap-5 pt-5">
      <div className="rounded-5 flex-1 bg-white/5 p-6 drop-shadow-[0px_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex items-start justify-between pb-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <KeyshadeLogoSVG />
              <p className="text-2xl font-[700]">Keyshade</p>
            </div>
            <div className="text-base">{activeProject.description}</div>
          </div>

          <div className="rounded-[6px] bg-[#D9F7FF14] p-1.5 text-xs text-white">
            {formatTimeAgo(new Date(activeProject.updatedAt))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-1 items-start justify-between rounded-[8px] bg-white/10 p-5 ">
            <div className="flex flex-col gap-2">
              <p className="text-[20px] font-[500]">Secrets</p>
              <p className="text-[16px] font-[400] text-[#C9C9C9]">
                See all the secrets of the project!
              </p>
            </div>
            <div className="flex gap-2 bg-[#262626] p-2">
              <SecretSVG width={16} />
              {activeProject.secretCount}
            </div>
          </div>

          <div className="flex flex-1 items-start justify-between rounded-[8px] bg-white/10 p-5 ">
            <div className="flex flex-col gap-2">
              <p className="text-[20px] font-[500]">Variables</p>
              <p className="text-[16px] font-[400] text-[#C9C9C9]">
                See all the variables of the project!
              </p>
            </div>
            <div className="flex gap-2 bg-[#262626] p-2">
              <SecretSVG width={16} />
              {activeProject.variableCount}
            </div>
          </div>

          <div className="flex flex-1 items-start justify-between rounded-[8px] bg-white/10 p-5 ">
            <div className="flex flex-col gap-2">
              <p className="text-[20px] font-[500]">Environments</p>
              <p className="text-[16px] font-[400] text-[#C9C9C9]">
                See all the environments of the project!
              </p>
            </div>
            <div className="flex gap-2 bg-[#262626] p-2">
              <SecretSVG width={16} />
              {activeProject.environmentCount}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-5 flex flex-1 flex-col gap-2 bg-white/5 p-6 drop-shadow-[0px_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex items-center gap-x-2 border-b border-white/20 pb-5">
          <LockSVG />
          <p className="text-lg font-[700]">Security Settings</p>
        </div>

        {!privateKey && (
          <div className="flex  items-center justify-center rounded-[8px] border border-[#FDE047] p-[10px]">
            <p className="text-[16px] font-[400] text-[#FDE047]">
              You haven’t stored any private key with us, so secret values can’t
              be decrypted.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-1 flex-col gap-3 rounded-[8px] bg-white/10 p-5">
            <div className="flex flex-col gap-[4px]">
              <p className="text-[20px] font-[500]">
                Do you wanna setup private key?
              </p>
              <p className="text-[16px] font-[400] text-[#C9C9C9]">
                Settings up your private key in browser helps you with safely
                setting up your secret.
              </p>
            </div>
            <LocalKeySetup
              isStoredOnServer={isKeyStoredOnServer}
              onOpenSetupDialog={() => setShowAddKeyDialog(true)}
              privateKey={privateKey}
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 rounded-[8px] bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-[500]">
                Do you wanna regenerate private key?
              </p>
              <p className="text-base font-[400] text-[#C9C9C9]">
                This will help you and your team to shared secrets easily.
              </p>
            </div>
            <RegenerateKey projectSlug={activeProject.slug} />
          </div>

          <div className="flex flex-1 flex-col gap-3 rounded-[8px] bg-white/10 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-[500]">Store private key with us?</p>
              <p className="text-base font-[400] text-[#C9C9C9]">
                This will help you and your team to shared secrets easily.
              </p>
            </div>
            <ServerKeySetup
              isStoredOnServer={isKeyStoredOnServer}
              privateKey={privateKey}
              projectSlug={activeProject.slug}
            />
          </div>
        </div>
      </div>

      <SetupLocalKeyDialog
        currentProject={activeProject.name}
        isOpen={showAddKeyDialog}
        onClose={() => setShowAddKeyDialog(false)}
      />
    </div>
  )
}

export default OverviewPage
