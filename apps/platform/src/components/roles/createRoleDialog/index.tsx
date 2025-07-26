import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import React, { useCallback, useState } from 'react'
import type { AuthorityEnum } from '@keyshade/schema'
import { toast } from 'sonner'
import { AddSVG } from '@public/svg/shared'
import type { ProjectEnvironmentComboType } from '../projectEnvironmentSelector'
import ProjectEnvironmentSelector from '../projectEnvironmentSelector'
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
  createRoleOpenAtom,
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

export default function CreateRoleDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isCreateRolesOpen, setIsCreateRolesOpen] = useAtom(createRoleOpenAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)

  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<AuthorityEnum>
  >(new Set())
  const [projectEnvironmentSelection, setProjectEnvironmentSelection] =
    useState<ProjectEnvironmentComboType>({})

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [createRoleData, setCreateRoleData] = useState({
    name: '',
    description: '',
    colorCode: '#10b981'
  })

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
        ),
        authorities: Array.from(selectedPermissions)
      }
    )
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
      <DialogTrigger asChild>
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

            {/* Authority Selection */}
            <AuthoritySelector
              parent="ROLES"
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
            />
            <Separator />

            {/* Project and environment selection */}
            <ProjectEnvironmentSelector
              projectEnvironmentSelection={projectEnvironmentSelection}
              setProjectEnvironmentSelection={setProjectEnvironmentSelection}
            />
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
