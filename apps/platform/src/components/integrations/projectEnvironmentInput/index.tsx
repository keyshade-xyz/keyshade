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

interface ProjectEnvironmentInputProps {
  onProjectChange?: (projectSlug: string | null) => void
  onEnvironmentChange?: (environmentSlug: string | null) => void
  initialProject?: PartialProject | null
  initialEnvironment?: PartialEnvironment | null
}

export default function ProjectEnvironmentInput({
  onProjectChange,
  onEnvironmentChange,
  initialProject,
  initialEnvironment
}: ProjectEnvironmentInputProps): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [projects, setProjects] = useState<PartialProject[]>([])
  const [environments, setEnvironments] = useState<PartialEnvironment[]>([])
  const [selectedProject, setSelectedProject] = useState<PartialProject | null>(
    initialProject || null
  )
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<PartialEnvironment | null>(initialEnvironment || null)

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

  // Fetch all projects of the workspace
  useEffect(() => {
    if (!currentWorkspace) return

    getAllProjectsOfWorkspace().then(({ data, success }) => {
      if (!success || !data) return
      setProjects(
        data.items.map((project) => ({
          id: project.id,
          name: project.name,
          slug: project.slug
        }))
      )
    })
  }, [currentWorkspace, getAllProjectsOfWorkspace])

  // Fetch environments when project changes
  useEffect(() => {
    if (!selectedProject) {
      setEnvironments([])
      return
    }

    getAllEnvironmentsOfProject(selectedProject.slug).then(
      ({ data, success }) => {
        if (!success || !data) return
        setEnvironments(
          data.items.map((env) => ({
            id: env.id,
            name: env.name,
            slug: env.slug
          }))
        )
      }
    )
  }, [selectedProject, getAllEnvironmentsOfProject])

  const handleProjectSelect = useCallback(
    (project: PartialProject) => {
      setSelectedProject(project)
      if (onProjectChange) onProjectChange(project.slug)
      if (onEnvironmentChange) onEnvironmentChange(null)
    },
    [onProjectChange, onEnvironmentChange]
  )

  const handleEnvironmentSelect = useCallback(
    (environment: PartialEnvironment) => {
      setSelectedEnvironment(environment)
      if (onEnvironmentChange) onEnvironmentChange(environment.slug)
    },
    [onEnvironmentChange]
  )

  return (
    <div className="flex flex-col gap-y-5">
      <div className="flex flex-col gap-y-2">
        <label className=" font-medium text-white" htmlFor="project-select">
          Specify Project
        </label>
        <Select
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

      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-white" htmlFor="environment-select">
          Specify Environment
        </label>
        <Select
          disabled={!selectedProject}
          onValueChange={(value) => {
            const environment = JSON.parse(value) as PartialEnvironment
            handleEnvironmentSelect(environment)
          }}
          value={
            selectedEnvironment
              ? JSON.stringify(selectedEnvironment)
              : undefined
          }
        >
          <SelectTrigger
            className="h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5"
            id="environment-select"
          >
            <SelectValue placeholder="Select environment">
              {selectedEnvironment?.name || 'Select environment'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
            {environments.length > 0 ? (
              environments.map((env) => (
                <SelectItem key={env.id} value={JSON.stringify(env)}>
                  {env.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-yellow-600">
                No environments available for this project.
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
