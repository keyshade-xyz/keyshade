import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useEffect, useState } from 'react'
import type { AuthorityEnum, Environment, Project } from '@keyshade/schema'
import { toast } from 'sonner'
import { AddSVG, MinusSquareSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createRolesOpenAtom,
  rolesOfWorkspaceAtom,
  selectedWorkspaceAtom
} from '@/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import AuthoritySelector from '@/components/common/authority-selector'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

const COLORS_LIST = [
  {
    name: 'Emerald',
    color: '#10b981'
  },
  {
    name: 'Cyan',
    color: '#06b6d4'
  },
  {
    name: 'Indigo',
    color: '#6366f1'
  },
  {
    name: 'Purple',
    color: '#a855f7'
  },
  {
    name: 'fuchsia',
    color: '#d946ef'
  }
]

type ProjectEnvironmentComboType = Record<
  Project['slug'],
  {
    project: Project
    environments: Set<Environment>
  }
>

export default function CreateRolesDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isCreateRolesOpen, setIsCreateRolesOpen] = useAtom(createRolesOpenAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)

  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<AuthorityEnum>
  >(new Set())
  const [projectEnvironmentSelection, setProjectEnvironmentSelection] =
    useState<ProjectEnvironmentComboType>({})
  const [projectEnvironmentCombinations, setProjectEnvironmentCombinations] =
    useState<ProjectEnvironmentComboType>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [createRoleData, setCreateRoleData] = useState({
    name: '',
    description: '',
    colorCode: '#10b981'
  })
  const [projectSelectDropdowns, setProjectSelectDropdowns] =
    useState<number>(0)

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

  const createRole = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.createWorkspaceRole(
      {
        ...createRoleData,
        workspaceSlug: currentWorkspace!.slug,
        projectEnvironments: Object.entries(projectEnvironmentSelection).map(
          ([projectSlug, { environments }]) => ({
            projectSlug,
            environmentSlugs: Array.from(environments).map((env) => env.slug)
          })
        )
      }
    )
  )

  // Pre-fetch projects and its environments. Store it for future use
  useEffect(() => {
    if (!currentWorkspace) return

    getAllProjectsOfWorkspace().then(({ data, success }) => {
      if (!success || !data) return

      const projects = data.items

      projects.map(async (project) => {
        const { data: envData, success: envSuccess } =
          await getAllEnvironmentsOfProject(project.slug)
        if (envSuccess && envData) {
          const environments: Environment[] = envData.items.map((env) => ({
            id: env.id,
            name: env.name,
            createdAt: env.createdAt,
            description: env.description,
            lastUpdatedById: env.lastUpdatedBy.id,
            projectId: project.id,
            slug: env.slug,
            updatedAt: env.updatedAt
          }))

          setProjectEnvironmentCombinations((prev) => {
            prev[project.slug] = {
              project,
              environments: new Set(environments)
            }
            return prev
          })
        }
      })
    })
  }, [currentWorkspace, getAllEnvironmentsOfProject, getAllProjectsOfWorkspace])

  const handleAddProjectSelection = useCallback((project: Project) => {
    setProjectSelectDropdowns((prev) => prev - 1)
    setProjectEnvironmentSelection((prev) => {
      prev[project.slug] = {
        project,
        environments: new Set()
      }
      return prev
    })
  }, [])

  const handleRemoveProjectSelection = useCallback((project: Project) => {
    setProjectEnvironmentSelection((prev) => {
      const { [project.slug]: _, ...rest } = prev
      return rest
    })
  }, [])

  const handleToggleEnvironmentSelect = useCallback(
    (project: Project, environment: Environment) => {
      const projectSlug = project.slug
      setProjectEnvironmentSelection((prev) => {
        const selectedEnvironments = prev[projectSlug].environments
        if (selectedEnvironments.has(environment)) {
          selectedEnvironments.delete(environment)
        } else {
          selectedEnvironments.add(environment)
        }
        prev[projectSlug] = {
          project,
          environments: selectedEnvironments
        }
        return prev
      })
    },
    []
  )

  const handleCleanup = useCallback(() => {
    setIsLoading(false)
    setCreateRoleData({
      name: '',
      description: '',
      colorCode: '#10b981'
    })
    setSelectedPermissions(new Set())
    setProjectEnvironmentSelection({})
    setProjectSelectDropdowns(0)
    toast.dismiss()
  }, [])

  const handleCreateRole = useCallback(async () => {
    if (createRoleData.name.trim() === '') {
      toast.error('Role name is required', {
        description: (
          <p className="text-xs text-red-300">
            Please provide a name for the role.
          </p>
        )
      })
      return
    }

    setIsLoading(true)
    toast.loading('Creating role...')
    try {
      const { success, data } = await createRole()

      if (success && data) {
        toast.success('Role created successfully', {
          description: (
            <p className="text-xs text-green-300">
              You created a new environment
            </p>
          )
        })

        // Adding the role to the store
        setRoles((prev) => [...prev, data])
        setIsCreateRolesOpen(false)
      }
    } finally {
      handleCleanup()
      setIsCreateRolesOpen(false)
    }
  }, [
    createRole,
    createRoleData.name,
    handleCleanup,
    setIsCreateRolesOpen,
    setRoles
  ])

  return (
    <Dialog
      onOpenChange={() => {
        setIsCreateRolesOpen((prev) => !prev)
        handleCleanup()
      }}
      open={isCreateRolesOpen}
    >
      <DialogTrigger>
        <Button>
          <AddSVG /> Add Role
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[80vh] min-w-[42rem] overflow-auto rounded-[12px] border bg-[#1E1E1F]">
        <div className="flex h-[3.125rem] w-full flex-col items-start justify-center">
          <DialogHeader className=" font-geist h-[1.875rem] w-[8.5rem] text-[1.125rem] font-semibold text-white ">
            Create Role
          </DialogHeader>

          <DialogDescription className=" font-inter h-[1.25rem] w-full text-[0.875rem] font-normal text-[#D4D4D4]">
            Create a new role for your workspace
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-y-8">
          <div className="flex h-full w-full flex-col gap-[1rem] py-[1rem] ">
            {/* NAME */}
            <div className="flex h-[2.25rem] w-full items-center justify-start gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[7rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="name"
              >
                Name
              </Label>
              <Input
                className="col-span-3 h-[2.25rem] w-[20rem] "
                id="name"
                onChange={(e) =>
                  setCreateRoleData((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                placeholder="Enter the name"
                value={createRoleData.name}
              />
            </div>

            {/* DESCRIPTION */}
            <div className="flex h-[5.625rem] w-full items-center justify-start gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[7rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="description"
              >
                Description
              </Label>
              <Textarea
                className="col-span-3 h-[5.625rem] w-[20rem] resize-none gap-[0.25rem]"
                id="description"
                onChange={(e) =>
                  setCreateRoleData((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                placeholder="Short description about the role"
                value={createRoleData.description}
              />
            </div>
            {/* COLOR PICKER */}
            <div className="flex h-[5.625rem] w-full items-center justify-start gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[7rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="color"
              >
                Color
              </Label>
              <Select
                onValueChange={(value) => {
                  const selectedColor = COLORS_LIST[Number(value)].color
                  setCreateRoleData((prev) => ({
                    ...prev,
                    colorCode: selectedColor
                  }))
                }}
                value={COLORS_LIST.findIndex(
                  (color) => color.color === createRoleData.colorCode
                ).toString()}
              >
                <SelectTrigger className="h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white ">
                  {COLORS_LIST.map((color, index) => (
                    <SelectItem
                      className="cursor-pointer"
                      key={color.color}
                      value={index.toString()}
                    >
                      <span className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: color.color }}
                        />
                        <span className="truncate">{color.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AuthoritySelector
              parent="ROLES"
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
            />
            <Separator />
            <div className="flex flex-col gap-y-5">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Projects and Environments
                </h2>
                <p className="text-sm text-neutral-300">
                  Projects and environment this role would have access to
                </p>
              </div>

              {/* Render dropdowns */}
              {projectSelectDropdowns > 0 &&
                Array.from({ length: projectSelectDropdowns }).map(
                  (_, index) => (
                    <Select
                      // eslint-disable-next-line react/no-array-index-key -- ok
                      key={index}
                      onValueChange={(value) => {
                        const project = JSON.parse(value) as Project
                        handleAddProjectSelection(project)
                      }}
                    >
                      <SelectTrigger className="h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
                        {Object.values(projectEnvironmentCombinations)
                          .filter(
                            ({ project }) =>
                              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is a false positive
                              !projectEnvironmentSelection[project.slug]
                          )
                          .map(({ project }) => (
                            <SelectItem
                              key={project.id}
                              value={JSON.stringify(project)}
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )
                )}

              {/* Render all the selected projects */}
              {Object.values(projectEnvironmentSelection).map(({ project }) => (
                <SelectedProjectComponent
                  handleRemoveProjectSelection={handleRemoveProjectSelection}
                  handleToggleEnvironmentSelect={handleToggleEnvironmentSelect}
                  key={project.id}
                  project={project}
                  projectEnvironmentCombinations={
                    projectEnvironmentCombinations
                  }
                  projectEnvironmentSelection={projectEnvironmentSelection}
                />
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
          </div>
        </div>
        <div className="flex h-[2.25rem] w-full justify-end">
          <Button
            className="font-inter h-[2.25rem] w-[8rem] rounded-[0.375rem] text-[0.875rem] font-[500]"
            disabled={isLoading}
            onClick={handleCreateRole}
            variant="secondary"
          >
            Create role
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SelectedProjectComponent({
  projectEnvironmentCombinations,
  projectEnvironmentSelection,
  project,
  handleToggleEnvironmentSelect,
  handleRemoveProjectSelection
}: {
  projectEnvironmentCombinations: ProjectEnvironmentComboType
  projectEnvironmentSelection: ProjectEnvironmentComboType
  project: Project
  handleToggleEnvironmentSelect: (
    project: Project,
    environment: Environment
  ) => void
  handleRemoveProjectSelection: (project: Project) => void
}) {
  const [isChecked, setIsChecked] = useState<
    Record<Environment['slug'], boolean>
  >({})

  useEffect(() => {
    const selectedEnvironmentsOfProject =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is a false positive
      projectEnvironmentSelection[project.slug].environments || new Set()
    const environmentsOfProject = Object.values(
      projectEnvironmentCombinations[project.slug].environments
    )

    const checklistData: Record<Environment['slug'], boolean> = {}

    for (const env of environmentsOfProject) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- this is a false positive
      checklistData[env.slug] = selectedEnvironmentsOfProject.has(env)
    }

    setIsChecked(checklistData)
  }, [
    project.slug,
    projectEnvironmentCombinations,
    projectEnvironmentSelection
  ])

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
        {Array.from(
          projectEnvironmentCombinations[project.slug].environments
        ).map((env: Environment) => (
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
