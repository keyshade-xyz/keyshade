import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

//add more integrations
const integrationFields: Record<string, string[]> = {
  discord: ['webhookUrl'],
  slack: ['botToken', 'signingSecret', 'channelId']
}

interface IntegrationFormProps {
  integrationType: keyof typeof integrationFields
  initialMetadata?: Record<string, string>
  onChange: (metadata: Record<string, string>) => void
}

function IntegrationMetadata({
  integrationType,
  initialMetadata = {},
  onChange
}: IntegrationFormProps): JSX.Element {
  const [metadata, setMetadata] = useState<Record<string, string>>(() => {
    const fields = integrationFields[integrationType]
    return fields.reduce<Record<string, string>>((acc, key) => {
      acc[key] = initialMetadata[key] || ''
      return acc
    }, {})
  })

  useEffect(() => {
    onChange(metadata)
  }, [metadata, onChange])

  const handleInputChange = (fieldKey: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [fieldKey]: value }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h3 className="font-medium capitalize text-white">
        {integrationType} Configuration
      </h3>
      <div className="flex flex-col gap-y-4 rounded-lg border border-white/10 bg-neutral-800 p-4">
        {integrationFields[integrationType].map((fieldKey) => (
          <div className="flex flex-col gap-y-2" key={fieldKey}>
            <label className="font-medium text-white" htmlFor={fieldKey}>
              {fieldKey
                .replace(/(?:[A-Z])/g, ' $&')
                .replace(/^./, (str) => str.toUpperCase())}
            </label>
            <Input
              className="h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5 text-white"
              id={fieldKey}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={`Enter ${fieldKey}`}
              type="text"
              value={metadata[fieldKey]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default IntegrationMetadata
