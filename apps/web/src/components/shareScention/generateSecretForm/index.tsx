'use client'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import ControllerInstance from '@/lib/controller-instance'

interface ShareSecretRequest {
  secret: string
  password?: string
  expiresAfterDays?: number
  viewLimit?: number
}

interface GenerateSecretFormProps {
  generatedShareHash: (hash: string) => void
}

function GenerateSecretForm({ generatedShareHash }: GenerateSecretFormProps) {
  const MAX_LETTER_LIMIT = 3000

  const [secret, setSecret] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [expiresAfterDays, setExpiresAfterDays] = useState<number>(1)
  const [viewLimit, setViewLimit] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const createSecret = useCallback(async () => {
    if (!secret.trim()) {
      return
    }
    setIsLoading(true)
    try {
      const requestData: ShareSecretRequest = {
        secret: secret.trim(),
        expiresAfterDays,
        viewLimit
      }
      if (password.trim()) {
        requestData.password = password.trim()
      }
      toast.loading('Creating secret...')
      const result =
        await ControllerInstance.getInstance().shareSecretController.createShareSecret(
          requestData
        )
      toast.dismiss()
      if (result.success && result.data) {
        toast.success('Secret created successfully!')

        generatedShareHash(result.data.hash)
        setSecret('')
        setPassword('')
        setExpiresAfterDays(1)
        setViewLimit(1)
      }
    } catch (error) {
      toast.error(
        'Failed to create secret. Please try again later or contact support.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [secret, password, expiresAfterDays, viewLimit, generatedShareHash])

  const handleSecretChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSecret(e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }
  const handleCreateSecret = () => {
    void createSecret()
  }
  const isFormValid = secret.trim().length > 0

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4">
      {/* Secret Input */}
      <div className="flex w-full flex-col gap-y-3">
        <div className="flex w-full items-center justify-between">
          <Label>Your Secret</Label>
          <p className="text-xs text-white/50">
            {secret.length}/{MAX_LETTER_LIMIT}
          </p>
        </div>
        <Textarea
          className="min-h-[20vh] w-full resize-none justify-between rounded-xl border border-[#B3EBF2]/50 bg-black/30 p-4 backdrop-blur-sm"
          maxLength={MAX_LETTER_LIMIT}
          onChange={handleSecretChange}
          placeholder="Paste your secret/token/password here"
          value={secret}
        />
      </div>

      {/* Password Input */}
      <div className="flex w-full flex-col gap-y-3">
        <Label>
          Add Password Protection{' '}
          <span className="text-sm text-white/50">(optional)</span>
        </Label>
        <Input
          className="w-full rounded-xl border border-[#B3EBF2]/50 p-2.5 backdrop-blur-sm"
          onChange={handlePasswordChange}
          placeholder="Password"
          type="password"
          value={password}
        />
      </div>

      {/* Expiration and View Limit */}
      <div className="flex w-full gap-x-5">
        <div className="flex w-full flex-col gap-y-3">
          <Label>Set expiration</Label>
          <div>
            <Select
              onValueChange={(value) => {
                setExpiresAfterDays(Number(value))
              }}
              value={expiresAfterDays.toString()}
            >
              <SelectTrigger className="h-fit w-full rounded-xl border border-[#B3EBF2]/50 bg-transparent p-2 text-white/50 backdrop-blur-sm">
                <SelectValue placeholder="Choose when the secret should expire" />
              </SelectTrigger>
              <SelectContent className="border border-[#B3EBF2]/50 bg-[#111A1F] text-white/50">
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">1 Week</SelectItem>
                <SelectItem value="14">2 Weeks</SelectItem>
                <SelectItem value="30">1 Month</SelectItem>
                <SelectItem value="180">6 Months</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full flex-col gap-y-3">
          <Label>View Limit</Label>
          <div>
            <Select
              onValueChange={(value) => {
                setViewLimit(Number(value))
              }}
              value={viewLimit.toString()}
            >
              <SelectTrigger className="h-fit w-full rounded-xl border border-[#B3EBF2]/50 bg-transparent p-2 text-white/50 backdrop-blur-sm">
                <SelectValue placeholder="How many times can this secret be viewed?" />
              </SelectTrigger>
              <SelectContent className="border border-[#B3EBF2]/50 bg-[#111A1F] text-white/50">
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        className="mt-4 w-full bg-[#EFFCFF] text-[#125D67] disabled:opacity-50"
        disabled={!isFormValid || isLoading}
        onClick={handleCreateSecret}
        variant="secondary"
      >
        {isLoading
          ? 'Creating Secret...'
          : 'Generate and share your own secret'}
      </Button>
    </div>
  )
}

export default GenerateSecretForm
