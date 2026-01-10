import { Copy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ControllerInstance from '@/lib/controller-instance'

interface ShareSecretLinkProps {
  shareHash: string
}

function ShareSecretLink({ shareHash }: ShareSecretLinkProps) {
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const shareLink = `${window.location.origin}/share/${shareHash}`

  const emailSecret = useCallback(async () => {
    if (!email.trim()) return
    setIsLoading(true)
    try {
      toast.loading('Sending email...')
      const result =
        await ControllerInstance.getInstance().shareSecretController.emailShareSecret(
          {
            hash: shareHash,
            email
          }
        )
      toast.dismiss()
      if (result.success) {
        toast.success('Email sent successfully!')
        setEmail('')
      }
    } catch (error) {
      toast.error('Failed to send email. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [email, shareHash])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      // eslint-disable-next-line no-console -- Logging error for debugging copy failures
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link to clipboard')
    }
  }

  const handleEmailClick = () => {
    void emailSecret()
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4">
      <div className="flex w-full flex-col gap-y-3">
        <Label>Your secure link is ready</Label>
        <div className="flex items-center justify-between gap-2">
          <Input
            className="w-full rounded-xl border border-[#B3EBF2]/50 p-2.5 backdrop-blur-sm"
            readOnly
            value={shareLink}
          />
          <Button
            className="rounded-xl border border-[#B3EBF2]/50 p-2.5 text-white hover:bg-transparent hover:text-white/70"
            disabled={isLoading}
            onClick={() => {
              void handleCopyToClipboard()
            }}
            variant="ghost"
          >
            <Copy />
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-y-3">
        <Label>Email this link</Label>
        <div className="flex gap-x-3">
          <Input
            className="w-4/5 rounded-xl border border-[#B3EBF2]/50 p-2.5 backdrop-blur-sm"
            onChange={handleEmailChange}
            placeholder="Email id"
            value={email}
          />
          <Button
            className=" w-1/5 bg-[#EFFCFF] text-[#125D67]"
            disabled={!email.trim() || isLoading}
            onClick={() => {
              handleEmailClick()
            }}
            variant="secondary"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ShareSecretLink
