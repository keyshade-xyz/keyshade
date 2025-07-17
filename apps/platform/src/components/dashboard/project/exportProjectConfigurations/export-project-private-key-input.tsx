import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExportProjectPrivateKeyProps {
  onChange: (value: string) => void
  privateKey: string
}

export default function ExportProjectPrivateKeyInput({
  onChange,
  privateKey
}: ExportProjectPrivateKeyProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-start gap-4">
      <Label htmlFor="privateKey">Private Key</Label>
      <Input
        id="privateKey"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder="Paste private key here"
        type="password"
        value={privateKey}
      />
    </div>
  )
}
