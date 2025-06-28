import { useCallback, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { LinkSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  selectedWorkspaceAtom,
  viewAndDownloadProjectKeysOpenAtom
} from '@/store'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'
import { Label } from '@/components/ui/label'
import WarningCard from '@/components/shared/warning-card'
import { CommandSuggestion } from '@/components/shared/dashboard/command-suggestion'

interface ViewAndDownloadProjectKeysDialogProps {
  projectKeys?: {
    projectName: string
    environmentSlug?: string
    storePrivateKey: boolean
    keys: {
      publicKey: string
      privateKey: string
    }
  }
  projectSlug: string
  isCreated: boolean
}

export default function ViewAndDownloadProjectKeysDialog({
  projectKeys,
  projectSlug,
  isCreated
}: ViewAndDownloadProjectKeysDialogProps): JSX.Element {
  const [
    isViewAndDownloadProjectKeysDialogOpen,
    setIsViewAndDownloadProjectKeysDialogOpen
  ] = useAtom(viewAndDownloadProjectKeysOpenAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const [isDownloading, setIsDownloading] = useState(false)

  const toggleDialog = useCallback(() => {
    setIsViewAndDownloadProjectKeysDialogOpen((prev) => !prev)
  }, [setIsViewAndDownloadProjectKeysDialogOpen])

  const handleDownloadKeys = () => {
    setIsDownloading(true)

    const privateKey = projectKeys?.keys.privateKey
    const publicKey = projectKeys?.keys.publicKey

    const fileContent = `private_key=${privateKey}\npublic_key=${publicKey}`
    const blob = new Blob([fileContent], { type: 'text/plain' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const projectName = projectKeys?.projectName
    link.download = `${projectName}-keys.txt`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setIsDownloading(false)
  }

  return (
    <Dialog
      onOpenChange={setIsViewAndDownloadProjectKeysDialogOpen}
      open={isViewAndDownloadProjectKeysDialogOpen}
    >
      <DialogContent className="w-full rounded-[12px] border bg-[#1E1E1F] ">
        <div className="flex w-full flex-col items-start justify-center gap-2">
          <DialogTitle className="text-center text-lg font-semibold text-white ">
            Download project keys?
          </DialogTitle>
        </div>
        <div className="flex flex-col gap-3 overflow-auto">
          {/* public key */}
          <Label>Public key</Label>
          <HiddenContent
            isPrivateKey={false}
            value={projectKeys!.keys.publicKey}
          />

          {/* private key */}
          <Label>Private key</Label>
          <HiddenContent isPrivateKey value={projectKeys!.keys.privateKey} />
        </div>
        <WarningCard>
          Make sure to download the public and private project keys now. You
          won’t be able to view it again.
        </WarningCard>

        <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium text-white">
              {isCreated
                ? 'Configure your new project'
                : 'Configure your updated project'}
            </Label>
            <a
              className="flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
              href="https://docs.keyshade.xyz/cli/introduction"
              rel="noopener noreferrer"
              target="_blank"
            >
              CLI Documentation
              <LinkSVG />
            </a>
          </div>

          <CommandSuggestion
            privatekey={projectKeys!.keys.privateKey}
            value={
              isCreated
                ? `keyshade init --workspace ${selectedWorkspace?.slug} --project ${projectSlug} --environment ${projectKeys!.environmentSlug} --private-key`
                : `keyshade config private-key update --workspace ${selectedWorkspace?.slug} --project ${projectSlug}`
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <Button className="w-full" onClick={toggleDialog}>
            Close
          </Button>
          <Button
            className="w-full"
            disabled={isDownloading}
            onClick={handleDownloadKeys}
            variant="secondary"
          >
            Download keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
