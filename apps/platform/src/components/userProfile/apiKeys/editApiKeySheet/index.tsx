import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CreateApiKeyRequest, UpdateApiKeyRequest } from '@keyshade/schema'
import dayjs from 'dayjs'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  apiKeysOfProjectAtom,
  editApiKeyOpenAtom,
  selectedApiKeyAtom,
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

export default function EditApiKeySheet(): JSX.Element {
  const [isEditApiKeyOpen, setIsEditApiKeyOpen] = useAtom(editApiKeyOpenAtom)
  const selectedApiKeyData = useAtomValue(selectedApiKeyAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)

  const [requestData, setRequestData] = useState<{
    apiKeyName: string | undefined
    expiryDate: string | null
  }>({
    apiKeyName: selectedApiKeyData?.name,
    expiryDate: selectedApiKeyData?.expiresAt !== null ? dayjs(selectedApiKeyData?.expiresAt).diff(dayjs(), 'hour').toString() : 'never'
  })

  const [selectedPermissions, setSelectedPermissions] = useState<Set<CreateApiKeyRequest["authorities"]>>(() => {
    if (selectedApiKeyData?.authorities && Array.isArray(selectedApiKeyData.authorities)) {
      return new Set(selectedApiKeyData.authorities.map(auth => [auth]));
    }
    return new Set();
  });

  const togglePermission = useCallback(
    (permissionId: CreateApiKeyRequest['authorities']) => {
      setSelectedPermissions((current) => {
        const newPermissions = new Set(current)

        const isSelected = Array.from(current).some(selectedPerm =>
          JSON.stringify(selectedPerm) === JSON.stringify(permissionId)
        );

        if (isSelected) {
          Array.from(current).forEach(selectedPerm => {
            if (JSON.stringify(selectedPerm) === JSON.stringify(permissionId)) {
              newPermissions.delete(selectedPerm);
            }
          });
        } else {
          newPermissions.add(permissionId);
        }

        return newPermissions;
      });
    },
    []
  );

  const getGroupState = useCallback(
    (group: AuthorityGroup): boolean | 'indeterminate' => {
      if (!group.permissions) {
        return false;
      }

      const totalPermissions = group.permissions.length;
      let selectedCount = 0;

      group.permissions.forEach(permission => {
        const isSelected = Array.from(selectedPermissions).some(selectedPerm =>
          JSON.stringify(selectedPerm) === JSON.stringify(permission.id)
        );

        if (isSelected) {
          selectedCount++;
        }
      });

      if (selectedCount === 0) return false;
      if (selectedCount === totalPermissions) return true;
      return 'indeterminate';
    },
    [selectedPermissions]
  );

  const isPermissionSelected = useCallback(
    (permissionId: CreateApiKeyRequest['authorities']): boolean => {
      return Array.from(selectedPermissions).some(selectedPerm =>
        JSON.stringify(selectedPerm) === JSON.stringify(permissionId)
      );
    },
    [selectedPermissions]
  );

  const toggleGroup = useCallback(
    (group: AuthorityGroup) => {
      setSelectedPermissions((current) => {
        const newPermissions = new Set(current)
        if (group.permissions) {
          const groupState = getGroupState(group)
          group.permissions.forEach((permission) => {
            const isPermissionInSet = Array.from(current).some(selectedPerm =>
              JSON.stringify(selectedPerm) === JSON.stringify(permission.id)
            );

            if (groupState === true) {
              if (isPermissionInSet) {
                Array.from(current).forEach(selectedPerm => {
                  if (JSON.stringify(selectedPerm) === JSON.stringify(permission.id)) {
                    newPermissions.delete(selectedPerm);
                  }
                });
              }
            } else if (!isPermissionInSet) {
                newPermissions.add(permission.id);
              }
          })
        }
        return newPermissions
      })
    },
    [getGroupState]
  )

  const handleClose = useCallback(() => {
    setIsEditApiKeyOpen(false)
  }, [setIsEditApiKeyOpen])

  const updateApiKey = useCallback(async () => {
    if (!selectedApiKeyData) {
      toast.error('No API Key selected', {
        description: (
          <p className="text-xs text-red-300">
            No API selected. Please select an API Key.
          </p>
        )
      })
      return
    }

    // Create a new array from selectedPermissions to ensure we have the latest state
    const authoritiesArray = Array.from(selectedPermissions).flat() as CreateApiKeyRequest['authorities']

    const request: UpdateApiKeyRequest = {
      name:
        !requestData.apiKeyName?.trim() || requestData.apiKeyName === selectedApiKeyData.name
          ? undefined
          : requestData.apiKeyName.trim(),
      apiKeySlug: selectedApiKeyData.slug,
      expiresAfter: requestData.expiryDate as 'never' | '24' | '168' | '720' | '8760',
      authorities: authoritiesArray
    }
    // console.log("req: ", request)

    try {
      toast.loading("Updating your API Key...")
      const { success, error, data } =
        await ControllerInstance.getInstance().apiKeyController.updateApiKey(
          request,
          {}
        )

      if (success && data) {
        // console.log("data after update: ", data)
        toast.success('API Key edited successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              You successfully edited the API Key
            </p>
          )
        })

        // Update the API Keys in the store
        setApiKeys((prev) => {
          const newApiKeys = prev.map((a) => {
            if (a.slug === selectedApiKeyData.slug) {
              const newExpiresAt = requestData.expiryDate === 'never' ? null : new Date(Date.now() + Number(requestData.expiryDate) * 60 * 60 * 1000).toISOString();
              const updatedApiKey = {
                ...a,
                name: requestData.apiKeyName || a.name,
                expiresAt: newExpiresAt,
                authorities: authoritiesArray,
                slug: data.slug
              };
              return updatedApiKey;
            }
            return a;
          });
          return newApiKeys;
        })
      }
      if (error) {
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong while updating the API Key. Check console for
              more info.
            </p>
          )
        })
        // eslint-disable-next-line no-console -- we need to log the error
        console.error('Error while updating API Key: ', error)
      }
    } catch (error) {
      // eslint-disable-next-line no-console -- we need to log the error
      console.error('Error while updating API Key: ', error)
    } finally {
      toast.dismiss()
    }

    handleClose()
  }, [selectedApiKeyData, requestData, handleClose, setApiKeys, selectedPermissions])

  useEffect(() => {
    if (selectedApiKeyData?.authorities && Array.isArray(selectedApiKeyData.authorities)) {
      setSelectedPermissions(new Set(selectedApiKeyData.authorities.map(auth => [auth])));

      setRequestData({
        apiKeyName: selectedApiKeyData.name,
        expiryDate: selectedApiKeyData.expiresAt !== null ? dayjs(selectedApiKeyData.expiresAt).diff(dayjs(), 'hour').toString() : 'never'
      });
    }
  }, [selectedApiKeyData]);

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsEditApiKeyOpen(open)
      }}
      open={isEditApiKeyOpen}
    >
      <SheetContent className="min-w-[33rem] border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit API Key</SheetTitle>
          <SheetDescription className="text-white/60" />
        </SheetHeader>
        <div className="grid gap-x-4 gap-y-6 py-8">
          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Key Name
            </Label>
            <Input
              className="col-span-3 h-[2.75rem]"
              id="name"
              onChange={(e) => {
                setRequestData((prev) => ({
                  ...prev,
                  apiKeyName: e.target.value
                }))
              }}
              placeholder="Enter the name of the API key"
              value={requestData.apiKeyName}
            />
          </div>

          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Expiry Date
            </Label>
            <Select
              onValueChange={(val) =>
                setRequestData((prev) => ({
                  ...prev,
                  expiryDate: val === 'never' ? 'never' : val
                }))
              }
              value={
                !requestData.expiryDate ? undefined :
                requestData.expiryDate === 'never' ? 'never' :
                  Number(requestData.expiryDate) <= 24 ? '24' :
                  Number(requestData.expiryDate) > 24 && Number(requestData.expiryDate) <= 168 ? '168' :
                  Number(requestData.expiryDate) > 168 && Number(requestData.expiryDate) <= 720 ? '720' :
                  Number(requestData.expiryDate) > 720 && Number(requestData.expiryDate) <= 8760 ? '8760' : undefined
              }
            >
              <SelectTrigger className="h-[2.75rem] border border-white/10 bg-neutral-800 text-gray-300">
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

          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Authorities
            </Label>
            <div className="custom-scrollbar mt-2 max-h-[200px] space-y-4 overflow-y-auto">
              {authorityGroups.map((group) => (
                <div className="space-y-2" key={group.name} >
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
                      <p className="whitespace-nowrap text-xs text-zinc-400">
                        {group.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 space-y-2">
                    {group.permissions?.map((permission) => (
                      <div
                        className="flex items-center gap-2"
                        key={String(permission.id)}
                      >
                        <Checkbox
                          checked={isPermissionSelected(permission.id)}
                          className="rounded-[4px] border border-[#18181B] bg-[#71717A] data-[state=checked]:border-[#18181B] data-[state=checked]:bg-[#71717A] data-[state=checked]:text-black"
                          id={String(permission.id)}
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter className="py-3">
          <SheetClose asChild>
            <Button
              className="font-semibold"
              onClick={updateApiKey}
              variant="secondary"
            >
              Edit API Key
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
