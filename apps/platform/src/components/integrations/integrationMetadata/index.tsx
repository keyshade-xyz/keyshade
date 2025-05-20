import React, { useEffect, useState } from 'react'
import { Integrations } from '@keyshade/common'
import { Input } from '@/components/ui/input'

interface IntegrationMetadataProps {
  integrationType: string
  initialMetadata?: Record<string, string>
  onChange: (metadata: Record<string, string>) => void
}

function IntegrationMetadata({
  integrationType,
  initialMetadata = {},
  onChange
}: IntegrationMetadataProps): JSX.Element {
  const [metadata, setMetadata] = useState<Record<string, string>>(() => {
    const metadataFields = Integrations.metadata(integrationType)
    return metadataFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.requestFieldName] =
        initialMetadata[field.requestFieldName] || ''
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
      <div className="flex flex-col gap-y-4 rounded-lg border border-white/10  p-4">
        {Integrations.metadata(integrationType).map((field) => (
          <div className="flex flex-col gap-y-1" key={field.requestFieldName}>
            <label
              className="font-medium text-white"
              htmlFor={field.requestFieldName}
            >
              {field.name}
            </label>
            {field.description ? <p className="mb-3 text-sm text-white/50">{field.description}</p> : null}
            <Input
              id={field.requestFieldName}
              onChange={(e) =>
                handleInputChange(field.requestFieldName, e.target.value)
              }
              placeholder={field.placeholder}
              type="text"
              value={metadata[field.requestFieldName]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default IntegrationMetadata
