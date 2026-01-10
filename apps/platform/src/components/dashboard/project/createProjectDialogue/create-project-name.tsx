import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface CreateProjectNameProps {
  onChange: (value: string) => void
}

export default function CreateProjectName({
  onChange
}: CreateProjectNameProps): React.JSX.Element {
  return (
    <div className="flex h-9 w-full items-center gap-7">
      <Label
        className="font-geist h-5 w-[4.813rem] gap-1 text-left text-[0.875rem] font-medium "
        htmlFor="name"
      >
        Name
      </Label>
      <Input
        className="col-span-3 h-9 w-[20rem] "
        id="name"
        onChange={(e) => {
          onChange(e.target.value)
        }}
        placeholder="Enter the name"
      />
    </div>
  )
}
