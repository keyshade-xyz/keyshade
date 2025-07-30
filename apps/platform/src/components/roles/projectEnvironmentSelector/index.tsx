import type { Environment, Project } from '@keyshade/schema'
import { useAtomValue } from 'jotai'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { AddSVG, MinusSquareSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
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
import { Checkbox } from '@/components/ui/checkbox'
import type { PartialEnvironment, PartialProject } from '@/types'

export type ProjectEnvironmentComboType = Record<
  Project['slug'],
  {
    project: PartialProject
    environments: Set<PartialEnvironment>
  }
>

function SelectedProjectComponent({
  projectEnvironmentCombinations,
  projectEnvironmentSelection,
  project,
  handleToggleEnvironmentSelect,
  handleRemoveProjectSelection
}: {
  projectEnvironmentCombinations: ProjectEnvironmentComboType
  projectEnvironmentSelection: ProjectEnvironmentComboType
  project: PartialProject
  handleToggleEnvironmentSelect: (
    project: PartialProject,
    environment: PartialEnvironment
  ) => void
  handleRemoveProjectSelection: (project: PartialProject) => void
}) {
  const [isChecked, setIsChecked] = useState<
    Record<Environment['slug'], boolean>
  >({})

  const combinationEnvironments = useMemo<Set<PartialEnvironment>>(
    () =>
      /* eslint-disable @typescript-eslint/no-unnecessary-condition -- False positive */
      projectEnvironmentCombinations[project.slug].environments ||
      new Set<PartialEnvironment>(),
    [projectEnvironmentCombinations, project.slug]
  )

  useEffect(() => {
    const selectedEnvironments =
      projectEnvironmentSelection[project.slug].environments

    const checklistData: Record<Environment['slug'], boolean> = {}
    const selectedEnvironmentSlugs = new Set<Environment['slug']>(
      Array.from(selectedEnvironments).map((env) => env.slug)
    )

    for (const env of Array.from(combinationEnvironments)) {
      checklistData[env.slug] = selectedEnvironmentSlugs.has(env.slug)
    }
    setIsChecked(checklistData)
  }, [combinationEnvironments, project.slug, projectEnvironmentSelection])

  return (
    <div className="flex w-[20rem] flex-col items-center justify-between gap-y-5 rounded-[0.375rem] border-[0.013rem] border-white/10 bg-neutral-800 px-3 py-2 text-white">
      <div className="flex w-full items-center justify-between gap-4">
        <span className="text-sm font-medium">{project.name}</span>
        <button
          onClick={() => handleRemoveProjectSelection(project)}
          type="button"
        >
          <MinusSquareSVG />
        </button>
      </div>
      <div className="flex w-full flex-wrap items-center justify-start gap-x-10 gap-y-3">
        {Array.from(combinationEnvironments).map((env: PartialEnvironment) => (
          <div className="flex items-center gap-x-3" key={env.slug}>
            <Checkbox
              checked={isChecked[env.slug]}
              className="h-5 w-5 rounded border-white/30 bg-transparent accent-white"
              id={env.slug}
              onCheckedChange={() =>
                handleToggleEnvironmentSelect(project, env)
              }
            />
            <label
              className="flex cursor-pointer items-center gap-1.5"
              htmlFor={env.slug}
            >
              <span className="text-sm">{env.name}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ProjectEnvironmentSelectorProps {
  projectEnvironmentSelection: ProjectEnvironmentComboType
  setProjectEnvironmentSelection: React.Dispatch<
    React.SetStateAction<ProjectEnvironmentComboType>
  >
}

export default function ProjectEnvironmentSelector({
  projectEnvironmentSelection,
  setProjectEnvironmentSelection
}: ProjectEnvironmentSelectorProps): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [projectEnvironmentCombinations, setProjectEnvironmentCombinations] =
    useState<ProjectEnvironmentComboType>({})
  const [projectSelectDropdowns, setProjectSelectDropdowns] = useState<number>(
    Object.entries(projectEnvironmentSelection).length
  )

  const getAllProjectsOfWorkspace = useHttp(() =>
    ControllerInstance.getInstance().projectController.getAllProjects({
      workspaceSlug: currentWorkspace!.slug,
      limit: 100 // Assumption that workspace has less than 100 projects
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

  // Pre-fetch projects and its environments. Store it for future use
  useEffect(() => {
    if (!currentWorkspace) return

    getAllProjectsOfWorkspace().then(({ data, success }) => {
      if (!success || !data) return

      const projects = data.items

      projects.forEach(async (project) => {
        const { data: envData, success: envSuccess } =
          await getAllEnvironmentsOfProject(project.slug)
        if (envSuccess && envData) {
          const environments: PartialEnvironment[] = envData.items.map(
            (env) => ({
              id: env.id,
              name: env.name,
              slug: env.slug
            })
          )

          setProjectEnvironmentCombinations((prev) => {
            return {
              ...prev,
              [project.slug]: {
                project,
                environments: new Set(environments)
              }
            }
          })
        }
      })
    })
  }, [currentWorkspace, getAllEnvironmentsOfProject, getAllProjectsOfWorkspace])

  const handleAddProjectSelection = useCallback(
    (project: PartialProject) => {
      setProjectSelectDropdowns((prev) => prev - 1)
      setProjectEnvironmentSelection((prev) => {
        return { ...prev, [project.slug]: { project, environments: new Set() } }
      })
    },
    [setProjectEnvironmentSelection]
  )

  const handleRemoveProjectSelection = useCallback(
    (project: PartialProject) => {
      setProjectEnvironmentSelection((prev) => {
        const { [project.slug]: _, ...rest } = prev
        return rest
      })
    },
    [setProjectEnvironmentSelection]
  )

  const handleToggleEnvironmentSelect = (
    project: PartialProject,
    environment: PartialEnvironment
  ) => {
    const projectSlug = project.slug

    const selectedEnvironments =
      projectEnvironmentSelection[projectSlug].environments
    if (selectedEnvironments.has(environment)) {
      // Remove the environment from the set
      selectedEnvironments.delete(environment)
    } else {
      // Add the environment to the set
      selectedEnvironments.add(environment)
    }

    setProjectEnvironmentSelection((prev) => {
      return {
        ...prev,
        [projectSlug]: {
          project,
          environments: selectedEnvironments
        }
      }
    })
  }

  return (
    <div className="flex flex-col gap-y-5">
      <div>
        <h2 className="text-base font-semibold text-white">
          Projects and Environments
        </h2>
        <p className="text-sm text-neutral-300">
          Projects and environment this role would have access to
        </p>
      </div>

      {/* Render all the selected projects */}
      {Object.entries(projectEnvironmentCombinations).length > 0 ? (
        Object.values(projectEnvironmentSelection).map(({ project }) => (
          <SelectedProjectComponent
            handleRemoveProjectSelection={handleRemoveProjectSelection}
            handleToggleEnvironmentSelect={handleToggleEnvironmentSelect}
            key={project.id}
            project={project}
            projectEnvironmentCombinations={projectEnvironmentCombinations}
            projectEnvironmentSelection={projectEnvironmentSelection}
          />
        ))
      ) : (
        <div className="text-sm text-yellow-600">
          You do not have any projects in the workspace.
        </div>
      )}

      {/* Render dropdowns */}
      {projectSelectDropdowns > 0 &&
        Array.from({ length: projectSelectDropdowns }).map((_, index) => (
          <Select
            // eslint-disable-next-line react/no-array-index-key -- ok
            key={index}
            onValueChange={(value) => {
              const project = JSON.parse(value) as PartialProject
              handleAddProjectSelection(project)
            }}
          >
            <SelectTrigger className="h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
              {Object.values(projectEnvironmentCombinations)
                .filter(
                  ({ project }) => !projectEnvironmentSelection[project.slug]
                )
                .map(({ project }) => (
                  <SelectItem key={project.id} value={JSON.stringify(project)}>
                    {project.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ))}

      <Button
        className="flex w-[9rem] items-center justify-between gap-x-2 border border-white/10 bg-neutral-800 px-4"
        disabled={
          Object.entries(projectEnvironmentCombinations).length ===
          Object.entries(projectEnvironmentSelection).length +
            projectSelectDropdowns
        }
        onClick={() => setProjectSelectDropdowns((prev) => prev + 1)}
      >
        <AddSVG />
        Add Project
      </Button>
    </div>
  )
}
