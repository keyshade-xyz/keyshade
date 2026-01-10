import React from 'react'
import { Trash2 } from 'lucide-react'
import type { CreateProjectRequest } from '@keyshade/schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CreateProjectNameProps {
  onChangeName: (value: string, index: number) => void
  onChangeDescription: (value: string, index: number) => void
  onDeleteEnvironment: (index: number) => void
  hasNoEnvironments: boolean
  environments: CreateProjectRequest['environments']
}

export default function CreateProjectEnvironmentList({
  onChangeName,
  onChangeDescription,
  onDeleteEnvironment,
  hasNoEnvironments,
  environments = []
}: CreateProjectNameProps): React.JSX.Element {
  if (hasNoEnvironments) {
    return (
      <div className="text-sm text-white/60">
        No environments specified. An environment named{' '}
        <span className="rounded-md bg-white/10 p-1 font-mono text-sm">
          default
        </span>{' '}
        would be created.
      </div>
    )
  }
  return (
    <>
      {environments.map((env, index) => (
        <div className="flex flex-col gap-4" key={`env-${index + 1}`}>
          <div className="flex items-center justify-between gap-4">
            <Input
              className="w-[20rem]"
              name="name"
              onChange={(e) => onChangeName(e.target.value, index)}
              placeholder="Name"
              value={env.name}
            />
            <Input
              className="w-[20rem] resize-none"
              name="description"
              onChange={(e) => onChangeDescription(e.target.value, index)}
              placeholder="Description"
              value={env.description}
            />
            <Button
              className="h-9 w-9 rounded-lg bg-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/40 hover:text-[#DC2626]"
              onClick={() => onDeleteEnvironment(index)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </>
  )
}
