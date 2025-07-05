import React, { useEffect, useMemo, useState } from 'react'
import { Integrations } from '@keyshade/common'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { Input } from '@/components/ui/input'

interface IntegrationMetadataProps {
  integrationType: IntegrationTypeEnum
  initialMetadata?: Record<string, unknown>
  integrationName: string
  onChange: (metadata: Record<string, string>) => void
}

function IntegrationMetadata({
  integrationType,
  initialMetadata = {},
  integrationName,
  onChange
}: IntegrationMetadataProps): JSX.Element {
  const metadataFields = useMemo(
    () => Integrations[integrationType].metadataFields,
    [integrationType]
  )

  const [metadata, setMetadata] = useState<Record<string, string>>(() => {
    return metadataFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.requestFieldName] =
        initialMetadata[field.requestFieldName] !== undefined
          ? String(initialMetadata[field.requestFieldName])
          : ''
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
        {integrationName} Configuration
      </h3>
      <div className="flex flex-col gap-y-4 rounded-lg border border-white/10  p-4">
        {metadataFields
          .filter((field) => !field.isEnvironment)
          .map(({ name, requestFieldName, description, placeholder }) => (
            <div className="flex flex-col gap-y-1" key={requestFieldName}>
              <label
                className="font-medium text-white"
                htmlFor={requestFieldName}
              >
                {name}
              </label>
              {description ? (
                <p className="mb-3 text-sm text-white/50">{description}</p>
              ) : null}
              <Input
                id={requestFieldName}
                onChange={(e) =>
                  handleInputChange(requestFieldName, e.target.value)
                }
                placeholder={placeholder}
                type="text"
                value={metadata[requestFieldName]}
              />
            </div>
          ))}
      </div>
    </div>
  )
}

export default IntegrationMetadata
