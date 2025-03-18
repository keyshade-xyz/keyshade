import { AddSVG, MinusSquareSVG } from '@public/svg/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useState } from 'react'
import type { AuthorityEnum, GetAllEnvironmentsOfProjectResponse } from '@keyshade/schema'
import { toast } from 'sonner'
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
import { createRolesOpenAtom, projectsOfWorkspaceAtom, rolesOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'
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

type EnvironmentWithCheck = GetAllEnvironmentsOfProjectResponse['items'][number] & {
  checked: boolean
}

export default function CreateRolesDialog() {
  const allProjects = useAtomValue(projectsOfWorkspaceAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)
  const [isCreateRolesOpen, setIsCreateRolesOpen] = useAtom(createRolesOpenAtom)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<AuthorityEnum>>(new Set())
  const [projectSelects, setProjectSelects] = useState<{
    projectSlug: string | undefined
    environments: EnvironmentWithCheck[] | undefined
  }[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not using selectedProjects anywhere but using its set method
  const [selectedProjects, setSelectedProjects] = useState<(string | undefined)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [createRoleData, setCreateRoleData] = useState({
    name: "",
    description: "",
    colorCode: "#10b981",
  })

  const handleProjectSelect = async (value: string, index: number) => {
    const newSelects = [...projectSelects]

    setSelectedProjects(prev => {
      const newSelected = prev.filter(p => p !== value)
      return [...newSelected, value]
    })

    const { success, data } = await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: value
      }
    )

    if (success && data) {
      newSelects[index] = {
        projectSlug: value,
        environments: data.items.map(env => ({ ...env, checked: false }))
      }
      setProjectSelects(newSelects)
    }
  }

  const handleEnvironmentSelect = (environment: string, index: number) => {
    const newSelects = [...projectSelects]
    const currentEnvironments = newSelects[index].environments

    if (!currentEnvironments) {
      return
    }

    if (currentEnvironments.some(env => env.slug === environment)) {
      newSelects[index] = {
        ...newSelects[index],
        environments: currentEnvironments.map(env =>
          env.slug === environment ? { ...env, checked: !env.checked } : env
        )
      }
    }

    setProjectSelects(newSelects)
  }

  const removeProjectSelection = (index: number) => {
    const newSelects = [...projectSelects]
    newSelects[index] = { ...newSelects[index], projectSlug: undefined, environments: undefined }
    setProjectSelects(newSelects)
  }

  const createRole = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.createWorkspaceRole({
      name: createRoleData.name,
      workspaceSlug: currentWorkspace!.slug,
      authorities: Array.from(selectedPermissions).flat(),
      description: createRoleData.description,
      colorCode: createRoleData.colorCode,
      projectEnvironments: projectSelects
        .filter(select => select.projectSlug && select.environments)
        .map(select => ({
          projectSlug: select.projectSlug!,
          environmentSlugs: select.environments!
            .filter(env => env.checked)
            .map(env => env.slug)
        }))
    })
  )

  const handleCreateRole = useCallback(async () => {
    if (createRoleData.name.trim() === "") {
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
      setIsLoading(false)
      toast.dismiss()
    }
  }, [createRole, createRoleData.name, setIsCreateRolesOpen, setRoles])

  return (
    <Dialog onOpenChange={setIsCreateRolesOpen} open={isCreateRolesOpen}>
      <DialogTrigger>
        <Button>
          <AddSVG /> Add Role
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[39.5rem] min-w-[42rem] rounded-[12px] border bg-[#1E1E1F] ">
        <div className="flex h-[3.125rem] w-full flex-col items-start justify-center">
          <DialogHeader className=" font-geist h-[1.875rem] w-[8.5rem] text-[1.125rem] font-semibold text-white ">
            Create Role
          </DialogHeader>

          <DialogDescription className=" font-inter h-[1.25rem] w-full text-[0.875rem] font-normal text-[#D4D4D4]">
            Create a new role for your workspace
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-y-8 overflow-auto">
          <div className="flex h-[29.125rem] w-full flex-col gap-[1rem] py-[1rem] ">
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
                onChange={(e) => setCreateRoleData(prev => ({ ...prev, name: e.target.value }))}
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
                onChange={(e) => setCreateRoleData(prev => ({ ...prev, description: e.target.value }))}
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
                  setCreateRoleData(prev => ({ ...prev, colorCode: selectedColor }))
                }}
                value={COLORS_LIST.findIndex(color => color.color === createRoleData.colorCode).toString()}
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
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
            />
            <Separator />
            <div className='flex flex-col gap-y-5'>
              <div>
                <h2 className='font-semibold text-base text-white'>
                  Projects and Environments
                </h2>
                <p className='text-sm text-neutral-300'>
                  Projects and environment this role would have access to
                </p>
              </div>
              {projectSelects.map((selection, index) => (
                selection.projectSlug ? (
                  <SelectedProjectComponent
                    allProjects={allProjects}
                    environments={selection.environments}
                    handleEnvironmentSelect={handleEnvironmentSelect}
                    index={index}
                    key={selection.projectSlug}
                    projectSlug={selection.projectSlug}
                    removeProjectSelection={removeProjectSelection}
                  />
                ) : (
                  // eslint-disable-next-line react/no-array-index-key -- we need to use keys here
                  <Select key={index} onValueChange={(value) => handleProjectSelect(value, index)}>
                    <SelectTrigger className="h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
                      {allProjects.map(project => (
                        <SelectItem
                          disabled={projectSelects.some(select => select.projectSlug === project.slug)}
                          key={project.id}
                          value={project.slug}
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              ))}
              <Button
                className='w-[9rem] bg-neutral-800 flex justify-between items-center px-4 gap-x-2 border border-white/10'
                onClick={() => {
                  setProjectSelects(prev => [...prev, { projectSlug: undefined, environments: [] }])
                }}
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

function SelectedProjectComponent({ projectSlug, allProjects, index, environments, removeProjectSelection, handleEnvironmentSelect }) {
  return (
    <div className="flex flex-col items-center justify-between w-[20rem] px-3 py-2 gap-y-5 rounded-[0.375rem] border-[0.013rem] border-white/10 bg-neutral-800 text-white">
      <div className="w-full flex justify-between items-center gap-4">
        <span className="text-sm font-medium">
          {allProjects.find((p) => p.slug === projectSlug)?.name}
        </span>
        <button onClick={() => removeProjectSelection(index)} type='button' >
          <MinusSquareSVG />
        </button>
      </div>
      <div className="w-full flex flex-wrap justify-start items-center gap-y-3 gap-x-10">
        {environments?.map(env => (
          <div className='flex items-center gap-x-3' key={env.slug} >
            <Checkbox
              checked={env.checked}
              className="h-5 w-5 accent-white bg-transparent border-white/30 rounded"
              id={env.slug}
              onCheckedChange={() => handleEnvironmentSelect(env.slug, index)}
            />
            <label
              className="flex items-center gap-1.5 cursor-pointer"
              htmlFor={env.slug}>
              <span className="text-sm">{env.name}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}