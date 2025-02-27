import React, { useCallback, useState } from 'react'
import { AddSVG } from '@public/svg/shared'
import type { CreateApiKeyRequest } from '@keyshade/schema'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../ui/dialog'
import { Button } from '../../../ui/button'
import { Input } from '../../../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../ui/select'
import ControllerInstance from '@/lib/controller-instance'
import { createApiKeyOpenAtom, apiKeysOfProjectAtom } from '@/store'
import { Checkbox } from '@/components/ui/checkbox'

interface AuthorityGroup {
  name: string
  description: string
  permissions?: {
    id: CreateApiKeyRequest['authorities']
    label: string
    description: string
  }[]
}

const authorityGroups: AuthorityGroup[] = [
  {
    name: 'PROJECT',
    description: 'Full access to all project actions',
    permissions: [
      {
        id: ['CREATE_PROJECT'],
        label: 'Create',
        description: 'Access to create projects'
      },
      {
        id: ['READ_PROJECT'],
        label: 'Read',
        description: 'Access to read projects'
      },
      {
        id: ['UPDATE_PROJECT'],
        label: 'Update',
        description: 'Access to update projects'
      },
      {
        id: ['DELETE_PROJECT'],
        label: 'Delete',
        description: 'Access to delete projects'
      }
    ]
  },
  {
    name: 'WORKSPACE',
    description: 'Full access to all workspace actions',
    permissions: [
      {
        id: ['CREATE_WORKSPACE'],
        label: 'Create',
        description: 'Access to create workspaces'
      },
      {
        id: ['READ_WORKSPACE'],
        label: 'Read',
        description: 'Access to read workspaces'
      },
      {
        id: ['UPDATE_WORKSPACE'],
        label: 'Update',
        description: 'Access to update workspaces'
      },
      {
        id: ['DELETE_WORKSPACE'],
        label: 'Delete',
        description: 'Access to delete workspaces'
      },
      {
        id: ['WORKSPACE_ADMIN'],
        label: 'Admin',
        description: 'Access to admin workspace'
      },
      {
        id: ['ADD_USER'],
        label: 'Add',
        description: 'Access to add users'
      },
      {
        id: ['READ_USERS'],
        label: 'Read',
        description: 'Access to read users'
      },
      {
        id: ['REMOVE_USER'],
        label: 'Remove',
        description: 'Access to remove users'
      },
      {
        id: ['UPDATE_USER_ROLE'],
        label: 'Update',
        description: 'Access to update users'
      },
      {
        id: ['CREATE_WORKSPACE_ROLE'],
        label: 'Create_Role',
        description: 'Access to create_role workspace'
      },
      {
        id: ['READ_WORKSPACE_ROLE'],
        label: 'Read_Role',
        description: 'Access to read_role workspace'
      },
      {
        id: ['UPDATE_WORKSPACE_ROLE'],
        label: 'Update_Role',
        description: 'Access to update_role workspace'
      },
      {
        id: ['WORKSPACE_ADMIN'],
        label: 'Admin',
        description: 'Full access to all admin actions'
      }
    ]
  },
  {
    name: 'SECRET',
    description: 'Full access to all secret actions',
    permissions: [
      {
        id: ['CREATE_SECRET'],
        label: 'Create',
        description: 'Access to create secrets'
      },
      {
        id: ['READ_SECRET'],
        label: 'Read',
        description: 'Access to read secrets'
      },
      {
        id: ['UPDATE_SECRET'],
        label: 'Update',
        description: 'Access to update secrets'
      },
      {
        id: ['DELETE_SECRET'],
        label: 'Delete',
        description: 'Access to delete secrets'
      }
    ]
  },
  {
    name: 'ENVIRONMENT',
    description: 'Full access to all environment actions',
    permissions: [
      {
        id: ['CREATE_ENVIRONMENT'],
        label: 'Create',
        description: 'Access to create environments'
      },
      {
        id: ['READ_ENVIRONMENT'],
        label: 'Read',
        description: 'Access to read environments'
      },
      {
        id: ['UPDATE_ENVIRONMENT'],
        label: 'Update',
        description: 'Access to update environments'
      },
      {
        id: ['DELETE_ENVIRONMENT'],
        label: 'Delete',
        description: 'Access to delete environments'
      }
    ]
  },
  {
    name: 'VARIABLE',
    description: 'Full access to all variable actions',
    permissions: [
      {
        id: ['CREATE_VARIABLE'],
        label: 'Create',
        description: 'Access to create variables'
      },
      {
        id: ['READ_VARIABLE'],
        label: 'Read',
        description: 'Access to read variables'
      },
      {
        id: ['UPDATE_VARIABLE'],
        label: 'Update',
        description: 'Access to update variables'
      },
      {
        id: ['DELETE_VARIABLE'],
        label: 'Delete',
        description: 'Access to delete variables'
      }
    ]
  },
  {
    name: 'INTEGRATIONS',
    description: 'Full access to all integration actions',
    permissions: [
      {
        id: ['CREATE_INTEGRATION'],
        label: 'Create',
        description: 'Access to create integrations'
      },
      {
        id: ['READ_INTEGRATION'],
        label: 'Read',
        description: 'Access to read integrations'
      },
      {
        id: ['UPDATE_INTEGRATION'],
        label: 'Update',
        description: 'Access to update integrations'
      },
      {
        id: ['DELETE_INTEGRATION'],
        label: 'Delete',
        description: 'Access to delete integrations'
      }
    ]
  },
  {
    name: 'API-KEY',
    description: 'Full access to all API-Key actions',
    permissions: [
      {
        id: ['CREATE_API_KEY'],
        label: 'Create',
        description: 'Access to create API-Key'
      },
      {
        id: ['READ_API_KEY'],
        label: 'Read',
        description: 'Access to read API-Key'
      },
      {
        id: ['UPDATE_API_KEY'],
        label: 'Update',
        description: 'Access to update API-Key'
      },
      {
        id: ['DELETE_API_KEY'],
        label: 'Delete',
        description: 'Access to delete API-Key'
      }
    ]
  },
  {
    name: 'PROFILE',
    description: 'Full access to all profile actions',
    permissions: [
      {
        id: ['UPDATE_PROFILE'],
        label: 'UPDATE_PROFILE',
        description: 'Full access to all update_profile actions'
      },
      {
        id: ['READ_SELF'],
        label: 'READ_SELF',
        description: 'Full access to all read_self actions'
      },
      {
        id: ['UPDATE_SELF'],
        label: 'UPDATE_SELF_READ_EVENT',
        description: 'Full access to all update_self_read_event actions'
      }
    ]
  }
]

export default function AddApiKeyDialog() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateApiKeyOpen, setIsCreateApiKeyOpen] =
    useAtom(createApiKeyOpenAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)
  const [newApiKeyData, setNewApiKeyData] = useState({
    apiKeyName: '',
    expiryDate: '24'
  })
  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<CreateApiKeyRequest['authorities']>
  >(new Set())

  const togglePermission = useCallback(
    (permissionId: CreateApiKeyRequest['authorities']) => {
      setSelectedPermissions((current) => {
        const newPermissions = new Set(current)
        if (newPermissions.has(permissionId)) {
          newPermissions.delete(permissionId)
        } else {
          newPermissions.add(permissionId)
        }
        return newPermissions
      })
    },
    []
  )

  const getGroupState = useCallback(
    (group: AuthorityGroup) => {
      if (!group.permissions) {
        return selectedPermissions.has(group.id)
      }
      const groupPermissions = group.permissions.map((p) => p.id)
      const selectedGroupPermissions = groupPermissions.filter((p) =>
        selectedPermissions.has(p)
      )

      if (selectedGroupPermissions.length === 0) return false
      if (selectedGroupPermissions.length === groupPermissions.length)
        return true
      return 'indeterminate'
    },
    [selectedPermissions]
  )

  const toggleGroup = useCallback(
    (group: AuthorityGroup) => {
      setSelectedPermissions((current) => {
        const newPermissions = new Set(current)
        if (group.permissions) {
          const groupState = getGroupState(group)
          group.permissions.forEach((permission) => {
            if (groupState === true) {
              newPermissions.delete(permission.id)
            } else {
              newPermissions.add(permission.id)
            }
          })
        } else if (newPermissions.has(group.id)) {
          newPermissions.delete(group.id)
        } else {
          newPermissions.add(group.id)
        }
        return newPermissions
      })
    },
    [getGroupState]
  )

  const handleAddApiKey = useCallback(async () => {
    setIsLoading(true)

    if (!newApiKeyData.apiKeyName) {
      toast.error('API Key name is required')
      return
    }

    const expiryDate = newApiKeyData.expiryDate || '24'
    if (!expiryDate) {
      toast.error('Expiry Date is required')
      return
    }

    // Create a new array from selectedPermissions to ensure we have the latest state
    const authoritiesArray = Array.from(selectedPermissions) ?? []

    const request: CreateApiKeyRequest = {
      name: newApiKeyData.apiKeyName,
      expiresAfter: expiryDate as 'never' | '24' | '168' | '720' | '8760',
      authorities: authoritiesArray
    }

    try {
      toast.loading('Creating your API Key...')
      const { success, error, data } =
        await ControllerInstance.getInstance().apiKeyController.crateApiKey(
          request,
          {}
        )

      if (success && data) {
        toast.success('API Key added successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              You created a new API Key
            </p>
          )
        })
        setApiKeys((prev) => [...prev, data])
        toast(`Created API Key: ${data.value}`, {
          action: {
            label: <X className="h-4 w-3" />,
            onClick: () => {
              toast.dismiss()
            }
          }
        })
      }
      if (error) {
        if (error.statusCode === 409) {
          toast.error('API Key already exists', {
            description: (
              <p className="text-xs text-red-300">
                An API Key with the same name already exists. Please use a
                different one.
              </p>
            )
          })
        } else {
          toast.error('Something went wrong!', {
            description: (
              <p className="text-xs text-red-300">
                Something went wrong while adding the API Key. Check the console
                for more details.
              </p>
            )
          })
          // eslint-disable-next-line no-console -- we need to log the error
          console.error(error)
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    } finally {
      toast.dismiss()
    }

    setNewApiKeyData({
      apiKeyName: '',
      expiryDate: '24'
    })
    setIsLoading(false)
    setIsCreateApiKeyOpen(false)
    setSelectedPermissions(new Set())
  }, [newApiKeyData, selectedPermissions, setIsCreateApiKeyOpen, setApiKeys])

  return (
    <Dialog
      onOpenChange={() => setIsCreateApiKeyOpen(!isCreateApiKeyOpen)}
      open={isCreateApiKeyOpen}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
          variant="outline"
        >
          <AddSVG /> Add API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[42rem] bg-[#18181B] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add a new API Key
          </DialogTitle>
          <DialogDescription>
            Add a new API key to the project
          </DialogDescription>
        </DialogHeader>

        <div className="text-white">
          <div className="space-y-4">
            <div className="flex h-[2.75rem] items-center justify-start gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="secret-name"
              >
                API Key Name
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                id="secret-name"
                onChange={(e) =>
                  setNewApiKeyData((prev) => ({
                    ...prev,
                    apiKeyName: e.target.value
                  }))
                }
                placeholder="Enter the API key"
                value={newApiKeyData.apiKeyName}
              />
            </div>

            <div className="flex h-[2.75rem] items-center justify-start gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="expiry-date"
              >
                Expiry Date
              </label>
              <Select
                defaultValue="24"
                onValueChange={(val) =>
                  setNewApiKeyData((prev) => ({
                    ...prev,
                    expiryDate: val
                  }))
                }
                value={newApiKeyData.expiryDate}
              >
                <SelectTrigger className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-neutral-800 text-gray-300">
                  <SelectItem value="24"> 1 day </SelectItem>
                  <SelectItem value="168"> 1 week </SelectItem>
                  <SelectItem value="720"> 1 month </SelectItem>
                  <SelectItem value="8760"> 1 year </SelectItem>
                  <SelectItem value="never"> Never </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-start gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="authorities"
              >
                Authorities
              </label>
              <div className="custom-scrollbar mt-2 max-h-[200px] space-y-4 overflow-y-auto">
                {authorityGroups.map((group) => (
                  <div className="space-y-2" key={group.name}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={getGroupState(group) === true}
                        className="rounded-[4px] border border-[#18181B] bg-[#71717A] text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-[#71717A] data-[state=checked]:text-black"
                        data-state={getGroupState(group)}
                        id={group.name}
                        onCheckedChange={() => toggleGroup(group)}
                      />
                      <div className="flex w-full items-center gap-x-5">
                        <label className="min-w-44 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {group.name}
                        </label>
                        <p className="whitespace-nowrap text-xs text-zinc-400 max-w-10">
                          {group.description}
                        </p>
                      </div>
                    </div>
                    <div className="ml-6 space-y-2">
                      {group.permissions
                        ? group.permissions.map((permission) => (
                            <div
                              className="flex items-center gap-2"
                              key={permission.id}
                            >
                              <Checkbox
                                checked={selectedPermissions.has(permission.id)}
                                className="rounded-[4px] border border-[#18181B] bg-[#71717A] data-[state=checked]:border-[#18181B] data-[state=checked]:bg-[#71717A] data-[state=checked]:text-black"
                                id={permission.id}
                                onCheckedChange={() =>
                                  togglePermission(permission.id)
                                }
                              />
                              <div className="flex w-full items-center gap-x-5">
                                <label className="min-w-40 text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {permission.label}
                                </label>
                                <p className=" whitespace-nowrap text-xs text-zinc-400">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                disabled={isLoading}
                onClick={handleAddApiKey}
              >
                Add API Key
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
