import type { Environment, Project } from '@keyshade/schema'
import { useState, useEffect, useCallback } from 'react'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

type PartialProject = Pick<Project, 'id' | 'name' | 'slug'>
type PartialEnvironment = Pick<Environment, 'id' | 'name' | 'slug'>

interface UpdateEnvironmentProps {
  initialProject: PartialProject
  initialEnvironments: PartialEnvironment[]
  onEnvironmentChange: (environmentSlugs: Environment['slug'][]) => void
}

export default function UpdateEnvironment({
  initialProject,
  initialEnvironments,
  onEnvironmentChange
}: UpdateEnvironmentProps): React.JSX.Element {
  const [environments, setEnvironments] = useState<PartialEnvironment[]>([])
  const [selectedEnvironments, setSelectedEnvironments] =
    useState<PartialEnvironment[]>(initialEnvironments)

  const getAllEnvironmentsOfProject = useHttp((projectSlug: string) =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      { projectSlug, limit: 100 }
    )
  )

  useEffect(() => {
    getAllEnvironmentsOfProject(initialProject.slug).then(
      ({ data, success }) => {
        if (success && data) {
          setEnvironments(
            data.items.map((env) => ({
              id: env.id,
              name: env.name,
              slug: env.slug
            }))
          )
        }
      }
    )
  }, [initialProject.slug, getAllEnvironmentsOfProject])

  const handleEnvironmentSelection = useCallback(
    (environmentSlug: string) => {
      const selectedEnvironment = environments.find(
        (env) => env.slug === environmentSlug
      )
      if (selectedEnvironment) {
        setSelectedEnvironments([selectedEnvironment])
        onEnvironmentChange([selectedEnvironment.slug])
      }
    },
    [environments, onEnvironmentChange]
  )

  const getSelectValue = () =>
    selectedEnvironments.length ? selectedEnvironments[0].slug : ''

  const getSelectDisplayValue = () =>
    selectedEnvironments.length
      ? selectedEnvironments[0].name
      : 'Select an environment'

  return (
    <div className="flex flex-col gap-y-5">
      {/* Project Display */}
      <div className="flex flex-col gap-y-2">
        <p className="font-medium text-white">Project</p>
        <Select disabled value={initialProject.slug}>
          <SelectTrigger className="h-[2.25rem] w-[35rem] rounded border bg-white/5 opacity-50">
            <SelectValue>{initialProject.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={initialProject.slug}>
              {initialProject.name}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Environment Selection */}
      <div className="flex flex-col gap-y-2">
        <p className="font-medium text-white">Select Environment</p>
        <Select
          onValueChange={handleEnvironmentSelection}
          value={getSelectValue()}
        >
          <SelectTrigger className="h-[2.25rem] w-[35rem] rounded border bg-white/5">
            <SelectValue placeholder="Select an environment">
              {getSelectDisplayValue()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {environments.length > 0 ? (
              environments.map((env) => (
                <SelectItem key={env.id} value={env.slug}>
                  {env.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem disabled value="no-environments">
                No environments available for this project
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
