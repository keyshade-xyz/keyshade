import React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export const formatMap = new Map<
  string,
  { label: string; mimeType?: string; extension?: string }
>([
  ['json', { label: 'JSON', mimeType: 'application/json', extension: 'json' }]
])

interface ExportProjectFormatProps {
  onFormatChange: (value: string) => void
  selectValue: string
}

export default function ExportProjectFormatInput({
  onFormatChange,
  selectValue
}: ExportProjectFormatProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-start gap-4">
      <Label htmlFor="format">Export Format</Label>
      <Select
        name="format"
        onValueChange={(value: string) =>
          onFormatChange(value)
        }
        value={selectValue}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-800">
          {[...formatMap].map(([value, { label }]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
