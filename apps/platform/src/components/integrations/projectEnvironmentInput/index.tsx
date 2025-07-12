import type { Environment, Project } from '@keyshade/schema'
import { useAtomValue } from 'jotai'
import { useState, useEffect, useCallback } from 'react'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

type PartialProject = Pick<Project, 'id' | 'name' | 'slug'>
type PartialEnvironment = Pick<Environment, 'id' | 'name' | 'slug'>

interface SimpleProjectEnvironmentInputProps {
  initialProject?: PartialProject | null
  initialEnvironments?: PartialEnvironment[]
  onProjectChange?: (projectSlug: Project['slug'] | null) => void
  onEnvironmentChange?: (environmentSlugs: Environment['slug'][]) => void
  isProjectDisabled?: boolean
}

export default function ProjectEnvironmentInput({
  initialProject,
  initialEnvironments,
  onProjectChange,
  onEnvironmentChange,
  isProjectDisabled = false
}: SimpleProjectEnvironmentInputProps): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [projects, setProjects] = useState<PartialProject[]>([])
  const [environments, setEnvironments] = useState<PartialEnvironment[]>([])
  const [selectedProject, setSelectedProject] = useState<PartialProject | null>(
    initialProject || null
  )
  const [selectedEnvironments, setSelectedEnvironments] = useState<
    PartialEnvironment[]
  >(initialEnvironments || [])

  const getAllProjectsOfWorkspace = useHttp(() =>
    ControllerInstance.getInstance().projectController.getAllProjects({
      workspaceSlug: currentWorkspace!.slug,
      limit: 100
    })
  )

  const getAllEnvironmentsOfProject = useHttp((projectSlug: Project['slug']) =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug,
        limit: 100
      }
    )
  )

  // Fetch projects on mount
  useEffect(() => {
    if (!currentWorkspace || isProjectDisabled) return

    getAllProjectsOfWorkspace().then(({ data, success }) => {
      if (success && data) {
        setProjects(
          data.items.map((project) => ({
            id: project.id,
            name: project.name,
            slug: project.slug
          }))
        )
      }
    })
  }, [currentWorkspace, getAllProjectsOfWorkspace, isProjectDisabled])

  // Fetch environments when project changes
  useEffect(() => {
    if (!selectedProject) {
      setEnvironments([])
      return
    }

    getAllEnvironmentsOfProject(selectedProject.slug).then(
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
  }, [selectedProject, getAllEnvironmentsOfProject])

  const handleProjectSelect = useCallback(
    (project: PartialProject) => {
      setSelectedProject(project)
      setSelectedEnvironments([])
      onProjectChange?.(project.slug)
      onEnvironmentChange?.([])
    },
    [onProjectChange, onEnvironmentChange]
  )

  const handleEnvironmentToggle = useCallback(
    (environment: PartialEnvironment) => {
      setSelectedEnvironments((prev) => {
        const isSelected = prev.some((env) => env.id === environment.id)
        const newSelection = isSelected
          ? prev.filter((env) => env.id !== environment.id)
          : [...prev, environment]

        onEnvironmentChange?.(newSelection.map((env) => env.slug))
        return newSelection
      })
    },
    [onEnvironmentChange]
  )

  return (
    <div className="flex flex-col gap-y-5">
      {/* Project Selection */}
      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-white" htmlFor="project-select">
          Select Project
        </label>
        <Select
          disabled={isProjectDisabled}
          onValueChange={(value) => {
            const project = JSON.parse(value) as PartialProject
            handleProjectSelect(project)
          }}
          value={selectedProject ? JSON.stringify(selectedProject) : undefined}
        >
          <SelectTrigger
            className="h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5"
            id="project-select"
          >
            <SelectValue placeholder="Select project">
              {selectedProject?.name || 'Select project'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
            {projects.length > 0 ? (
              projects.map((project) => (
                <SelectItem key={project.id} value={JSON.stringify(project)}>
                  {project.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-yellow-600">
                No projects available in this workspace.
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Environment Selection */}
      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-white" htmlFor="environment-select">
          Select Environments
        </label>
        <div className="max-h-40 overflow-y-auto rounded-md border border-white/10 p-2">
          {!selectedProject ? (
            <div className="px-2 py-4 text-sm text-white/60">
              Please select a project first
            </div>
          ) : environments.length > 0 ? (
            environments.map((env) => (
              <div
                aria-checked={selectedEnvironments.some(
                  (selected) => selected.id === env.id
                )}
                className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-white/10"
                key={env.id}
                onClick={() => handleEnvironmentToggle(env)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleEnvironmentToggle(env)
                  }
                }}
                role="checkbox"
                tabIndex={0}
              >
                <input
                  checked={selectedEnvironments.some(
                    (selected) => selected.id === env.id
                  )}
                  className="rounded border-white/20 bg-white/10 text-blue-500"
                  onChange={() => handleEnvironmentToggle(env)}
                  type="checkbox"
                />
                <span className="text-white">{env.name}</span>
              </div>
            ))
          ) : (
            <div className="px-2 py-4 text-sm text-yellow-600">
              No environments available for this project.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
