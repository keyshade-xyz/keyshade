import { sDecrypt } from '@keyshade/common'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ShareSecretPasswordProps {
  encryptedSecret: string
  onSuccess: (decrypted: string) => void
}

function ShareSecretPassword({
  encryptedSecret,
  onSuccess
}: ShareSecretPasswordProps) {
  const [password, setPassword] = useState<string>('')
  const [incorrectPassword, setIncorrectPassword] = useState<boolean>(false)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const handleDecrypt = () => {
    try {
      const decryptedSecret: string = sDecrypt(encryptedSecret, password)
      onSuccess(decryptedSecret)
    } catch (error) {
      setIncorrectPassword(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl backdrop:blur-md">
      <div
        className="mx-10 flex h-fit min-w-[30vw] max-w-md flex-col items-center justify-center gap-y-4 rounded-2xl border-2 border-[#B3EBF2]/10 px-7 py-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] backdrop-blur-md"
        style={{
          background: `linear-gradient(130.61deg, rgba(12, 86, 96, 1 ) 0%, rgba(25, 177, 198, 0) 60%),
          linear-gradient(0deg, rgba(12, 86, 96, 0) 57.4%, rgba(12, 86, 96, 0.5) 100%)`
        }}
      >
        <div className="flex w-full flex-col gap-y-1">
          <Label className="pb-3">Enter password to view the secret</Label>
          <Input
            className="w-full rounded-xl border border-[#B3EBF2]/50 p-2.5 backdrop-blur-sm"
            onChange={handlePasswordChange}
            placeholder="Password"
            type="password"
            value={password}
          />
          {incorrectPassword ? (
            <p className="text-sm text-[#EFFCFF]/60">Incorrect password</p>
          ) : null}
        </div>

        <Button
          className="w-full bg-[#EFFCFF] text-[#125D67] hover:bg-[#EFFCFF]/90"
          onClick={handleDecrypt}
          variant="secondary"
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

export default ShareSecretPassword
