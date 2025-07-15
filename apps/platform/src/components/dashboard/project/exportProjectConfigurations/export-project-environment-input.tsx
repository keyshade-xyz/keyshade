import React from 'react'
import type { GetAllEnvironmentsOfProjectResponse } from '@keyshade/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ExportProjectEnvironemtnProps {
  onEnvironmentToggle: (slug: string, checked: boolean) => void;
  environmentsOfProject: GetAllEnvironmentsOfProjectResponse['items']
  environmentSlugs: string[]
}

export default function ExportProjectEnvironmentInput({
  onEnvironmentToggle,
  environmentsOfProject,
  environmentSlugs
}: ExportProjectEnvironemtnProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-start gap-4">
      <Label className="mb-2">Choose Environments</Label>
      <div className="space-y-1">
        {environmentsOfProject.map((env: { slug: string; name: string }) => (
          <div className="flex items-center gap-2" key={env.slug}>
            <Checkbox
              checked={environmentSlugs.includes(env.slug)}
              name={`env-${env.slug}`}
              onCheckedChange={(checked: boolean) =>
                onEnvironmentToggle(env.slug, checked)
              }
            />
            <Label htmlFor={`env-${env.slug}`}>{env.name}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}
