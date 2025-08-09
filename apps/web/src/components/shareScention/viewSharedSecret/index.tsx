'use client'
import { Copy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import ShareSecretPassword from '../shareSecretPassword'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ControllerInstance from '@/lib/controller-instance'

interface ViewShareSecretProps {
  secretHash: string
  setError: (error: string) => void
}

function ViewShareSecret({ secretHash, setError }: ViewShareSecretProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [secret, setSecret] = useState<string>('')
  const [isPasswordRequired, setIsPasswordRequired] = useState<boolean>(false)
  const [remainingDaysToExpire, setRemainingDaysToExpire] = useState<number>(0)

  const handleRedirect = () => {
    window.location.href = '/share'
  }

  const handlePasswordSuccess = (decrypted: string) => {
    setSecret(decrypted)
    setIsPasswordRequired(false)
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(secret)
      .then(() => {
        toast.success('Secret copied to clipboard!')
      })
      .catch((error) => {
        //eslint-disable-next-line no-console -- Logging error to help with debugging copy failures
        console.error('Failed to copy secret:', error)
        toast.error('Failed to copy to clipboard')
      })
  }

  const fetchSharedSecret = useCallback(
    async (hash: string) => {
      try {
        const result =
          await ControllerInstance.getInstance().shareSecretController.viewShareSecret(
            {
              hash
            }
          )
        if (result.success && result.data) {
          setSecret(result.data.secret)
          setIsPasswordRequired(result.data.isPasswordProtected)
          const secretExpiresAt = result.data.expiresAt
          const remainingDay = Math.ceil(
            (new Date(secretExpiresAt).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
          setRemainingDaysToExpire(remainingDay)
        } else {
          setError(
            'This secret is no longer available. It may have expired or been viewed already.'
          )
        }
      } catch (error) {
        setError(
          'Failed to fetch the secret. Please try again or contact support.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [setError]
  )

  useEffect(() => {
    if (!secretHash) return
    setIsLoading(true)
    void fetchSharedSecret(secretHash)
  }, [secretHash, fetchSharedSecret])

  const disableCopyButton = !secret || isLoading

  return (
    <>
      <div className="flex w-full flex-col items-center justify-center gap-y-4">
        <div className="flex w-full flex-col gap-y-1">
          <div className="flex items-center justify-between">
            <Label>Your Secret</Label>
            <Button
              className="text-white hover:bg-transparent hover:text-white/70"
              disabled={disableCopyButton}
              onClick={handleCopyToClipboard}
              variant="ghost"
            >
              <Copy />
            </Button>
          </div>
          <Textarea
            className="mt-1 min-h-[20vh] w-full resize-none rounded-xl border border-[#B3EBF2]/50 bg-black/30 p-4 backdrop-blur-sm"
            readOnly
            value={secret}
          />
          <p className="mt-1 text-sm text-white/60">
            This secret will self-destruct after it&apos;s viewed or after{' '}
            {remainingDaysToExpire} days
          </p>
        </div>

        <Button
          className=" w-full bg-[#EFFCFF] text-[#125D67]"
          disabled={isLoading}
          onClick={handleRedirect}
          variant="secondary"
        >
          Generate and share your own secret
        </Button>
      </div>
      {isPasswordRequired ? (
        <ShareSecretPassword alert={secret} onSuccess={handlePasswordSuccess} />
      ) : null}
    </>
  )
}

export default ViewShareSecret
