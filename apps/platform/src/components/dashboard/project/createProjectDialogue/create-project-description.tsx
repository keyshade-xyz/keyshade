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
    <div className="flex h-[5.625rem] w-full items-center gap-7">
      <Label
        className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
        htmlFor="name"
      >
        Description
      </Label>
      <Textarea
        className="col-span-3 h-[5.625rem] w-[20rem] resize-none gap-[0.25rem]"
        id="name"
        onChange={(e) => {
          onChange(e.target.value)
        }}
        placeholder="Short description about your whole project"
      />
    </div>
  )
}
