import { useAtom, useSetAtom } from 'jotai'
import React, { useCallback, useEffect, useState } from 'react'
import type { AuthorityEnum } from '@keyshade/schema'
import { toast } from 'sonner'
import type { ProjectEnvironmentComboType } from '../projectEnvironmentSelector'
import ProjectEnvironmentSelector from '../projectEnvironmentSelector'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  editRoleOpenAtom,
  rolesOfWorkspaceAtom,
  selectedRoleAtom
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

export default function EditRoleSheet() {
  const [selectedRole, setSelectedRole] = useAtom(selectedRoleAtom)
  const [isEditRolesOpen, setIsEditRolesOpen] = useAtom(editRoleOpenAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)

  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<AuthorityEnum>
  >(new Set(selectedRole?.authorities ?? []))
  const [projectEnvironmentSelection, setProjectEnvironmentSelection] =
    useState<ProjectEnvironmentComboType>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [editRoleData, setEditRoleData] = useState({
    name: selectedRole?.name ?? '',
    description: selectedRole?.description ?? '',
    colorCode: selectedRole?.colorCode ?? '#000000'
  })

  useEffect(() => {
    if (selectedRole) {
      const selections: ProjectEnvironmentComboType = {}

      for (const { project, environments } of selectedRole.projects) {
        selections[project.slug] = {
          project,
          environments: new Set(environments)
        }
      }

      setProjectEnvironmentSelection(selections)
    }
  }, [selectedRole])

  const updateRole = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.updateWorkspaceRole(
      {
        ...editRoleData,
        workspaceRoleSlug: selectedRole!.slug,
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
    setEditRoleData({
      name: '',
      description: '',
      colorCode: '#10b981'
    })
    setSelectedPermissions(new Set())
    setProjectEnvironmentSelection({})
    toast.dismiss()
  }, [])

  const handleEditRole = useCallback(async () => {
    if (editRoleData.name.trim() === '') {
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
    toast.loading('Updating role...')
    try {
      const { success, data } = await updateRole()

      if (success && data) {
        toast.success('Role updated successfully', {
          description: (
            <p className="text-xs text-green-300">
              You have successfully updated the role.
            </p>
          )
        })

        // Adding the role to the store
        setRoles((prev) =>
          prev.map((role) => (role.id === data.id ? data : role))
        )
        setSelectedRole(data)
        setIsEditRolesOpen(false)
      }
    } finally {
      handleCleanup()
      setIsEditRolesOpen(false)
    }
  }, [
    editRoleData.name,
    handleCleanup,
    setIsEditRolesOpen,
    setRoles,
    setSelectedRole,
    updateRole
  ])

  return (
    <Sheet
      onOpenChange={() => {
        setIsEditRolesOpen((prev) => !prev)
        handleCleanup()
      }}
      open={isEditRolesOpen}
    >
      <SheetContent className="min-w-[600px] overflow-y-auto border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit this role</SheetTitle>
          <SheetDescription className="text-white/60">
            Edit the details of the role
          </SheetDescription>
        </SheetHeader>
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
                  setEditRoleData((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                placeholder="Enter the name"
                value={editRoleData.name}
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
                  setEditRoleData((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                placeholder="Short description about the role"
                value={editRoleData.description}
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
                  setEditRoleData((prev) => ({
                    ...prev,
                    colorCode: selectedColor
                  }))
                }}
                value={COLORS_LIST.findIndex(
                  (color) => color.color === editRoleData.colorCode
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
            onClick={handleEditRole}
            variant="secondary"
          >
            Save changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
