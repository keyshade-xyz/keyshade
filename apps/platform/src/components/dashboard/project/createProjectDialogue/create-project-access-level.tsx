import React from 'react'
import type { CreateProjectRequest } from '@keyshade/schema'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface CreateProjectNameProps {
  onChange: (value: CreateProjectRequest['accessLevel']) => void
  value: CreateProjectRequest['accessLevel']
}

export default function CreateProjectAccessLevel({
  onChange,
  value
}: CreateProjectNameProps): React.JSX.Element {
  const ACCESS_LEVELS = [
    'GLOBAL',
    'INTERNAL',
    'PRIVATE'
  ] as const satisfies readonly CreateProjectRequest['accessLevel'][]

  return (
    <div className="flex h-[2.25rem] w-full items-center gap-4">
      <Label
        className="font-geist h-[0.875rem] w-[5.5rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
        htmlFor="accessLevel"
      >
        Access Level
      </Label>
      <Select
        onValueChange={(currValue) => {
          onChange(currValue as CreateProjectRequest['accessLevel'])
        }}
        value={value}
      >
        <SelectTrigger className=" h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5 focus:border-[#3b82f6]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white ">
          <SelectGroup>
            {ACCESS_LEVELS.map((accessValue) => (
              <SelectItem
                className="group cursor-pointer rounded-sm"
                key={accessValue.toUpperCase()}
                value={accessValue.toUpperCase()}
              >
                {accessValue}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
