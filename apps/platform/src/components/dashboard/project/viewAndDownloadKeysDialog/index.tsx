import { useCallback, useState } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { viewAndDownloadProjectKeysOpenAtom } from '@/store'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'
import { Label } from '@/components/ui/label'
import WarningCard from '@/components/shared/warning-card'

interface ViewAndDownloadProjectKeysDialogProps {
  projectKeys?: {
    projectName: string
    storePrivateKey: boolean
    keys: {
      publicKey: string
      privateKey: string
    }
  }
}

export default function ViewAndDownloadProjectKeysDialog({
  projectKeys
}: ViewAndDownloadProjectKeysDialogProps): JSX.Element {
  const [
    isViewAndDownloadProjectKeysDialogOpen,
    setIsViewAndDownloadProjectKeysDialogOpen
  ] = useAtom(viewAndDownloadProjectKeysOpenAtom)

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
          <DialogHeader className="text-center text-lg font-semibold text-white ">
            Download project keys?
          </DialogHeader>
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
