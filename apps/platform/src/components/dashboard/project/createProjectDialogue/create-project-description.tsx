import React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateProjectNameProps {
  onChange: (value: string) => void
}

export default function CreateProjectDescription({
  onChange
}: CreateProjectNameProps): React.JSX.Element {
  return (
    <div className="flex h-22.5 w-full items-center gap-7">
      <Label
        className="font-geist h-5 w-[4.813rem] gap-1 text-left text-[0.875rem] font-medium "
        htmlFor="name"
      >
        Description
      </Label>
      <Textarea
        className="col-span-3 h-22.5 w-[20rem] resize-none gap-1"
        id="name"
        onChange={(e) => {
          onChange(e.target.value)
        }}
        placeholder="Short description about your whole project"
      />
    </div>
  )
}
