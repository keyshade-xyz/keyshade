import type { AuthorityEnum } from '@keyshade/schema'
import { Checkbox } from '../ui/checkbox'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: AuthorityEnum // the authority id in prisma schema
  label: string
  description?: string
  requiredBy?: AuthorityEnum[] // an array of authorities that require this authority to be selected
  requires?: AuthorityEnum[] // an array of authorities that are required to be selected if this authority is selected
  explicitToApiKey?: boolean // if this authority is only to be displayed in the API Key creation form
}

interface GroupItem {
  name: string
  description: string
  permissions?: ChecklistItem[] // permissions
  subgroups?: GroupItem[] // Optional subgroup to allow nesting of groups
  explicitToApiKey?: boolean // if this authority is only to be displayed in the API Key creation form,
  level: number // Helps formatting nesting
}

const authorityGroups: GroupItem[] = [
  {
    name: 'Workspace',
    level: 1,
    description: 'Full access to all workspace actions',
    permissions: [
      {
        id: 'READ_WORKSPACE',
        label: 'Read',
        description: 'Access to read workspaces',
        requiredBy: [
          'CREATE_WORKSPACE',
          'UPDATE_WORKSPACE',
          'DELETE_WORKSPACE',
          'WORKSPACE_ADMIN'
        ]
      },
      {
        id: 'CREATE_WORKSPACE',
        label: 'Create',
        description: 'Access to create workspaces',
        explicitToApiKey: true,
        requires: ['READ_WORKSPACE'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'UPDATE_WORKSPACE',
        label: 'Update',
        description: 'Access to update workspaces',
        requires: ['READ_WORKSPACE'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'DELETE_WORKSPACE',
        label: 'Delete',
        description: 'Access to delete workspaces',
        requires: ['READ_WORKSPACE'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'WORKSPACE_ADMIN',
        label: 'Workspace Admin',
        description: 'Access to all workspace actions',
        requires: [
          'READ_WORKSPACE',
          'UPDATE_WORKSPACE',
          'DELETE_WORKSPACE',
          'CREATE_WORKSPACE',
          'CREATE_PROJECT',
          'READ_PROJECT',
          'UPDATE_PROJECT',
          'DELETE_PROJECT',
          'CREATE_WORKSPACE_ROLE',
          'READ_WORKSPACE_ROLE',
          'UPDATE_WORKSPACE_ROLE',
          'DELETE_WORKSPACE_ROLE',
          'ADD_USER',
          'READ_USERS',
          'REMOVE_USER',
          'UPDATE_USER_ROLE',
          'CREATE_SECRET',
          'READ_SECRET',
          'UPDATE_SECRET',
          'DELETE_SECRET',
          'CREATE_ENVIRONMENT',
          'READ_ENVIRONMENT',
          'UPDATE_ENVIRONMENT',
          'DELETE_ENVIRONMENT',
          'CREATE_VARIABLE',
          'READ_VARIABLE',
          'UPDATE_VARIABLE',
          'DELETE_VARIABLE',
          'CREATE_INTEGRATION',
          'READ_INTEGRATION',
          'UPDATE_INTEGRATION',
          'DELETE_INTEGRATION'
        ]
      }
    ],
    subgroups: [
      {
        name: 'Role',
        level: 2,
        description: 'Full access to manage workspace roles',
        permissions: [
          {
            id: 'READ_WORKSPACE_ROLE',
            label: 'Read',
            description: 'Access to read roles in a workspace',
            requiredBy: ['WORKSPACE_ADMIN']
          },
          {
            id: 'CREATE_WORKSPACE_ROLE',
            label: 'Create',
            description: 'Access to create roles in a workspace',
            requiredBy: ['WORKSPACE_ADMIN'],
            requires: ['READ_WORKSPACE_ROLE']
          },
          {
            id: 'UPDATE_WORKSPACE_ROLE',
            label: 'Update',
            description: 'Access to update roles in a workspace',
            requiredBy: ['WORKSPACE_ADMIN'],
            requires: ['READ_WORKSPACE_ROLE']
          },
          {
            id: 'DELETE_WORKSPACE_ROLE',
            label: 'Delete',
            description: 'Access to delete roles in a workspace',
            requiredBy: ['WORKSPACE_ADMIN'],
            requires: ['READ_WORKSPACE_ROLE']
          }
        ]
      },
      {
        name: 'Member',
        level: 2,
        description: 'Full access to all workspace membership actions',
        permissions: [
          {
            id: 'READ_USERS',
            label: 'Read',
            description: 'List users in a workspace',
            requiredBy: ['WORKSPACE_ADMIN']
          },
          {
            id: 'ADD_USER',
            label: 'Add',
            description: 'Add users to a workspace',
            requiredBy: ['WORKSPACE_ADMIN'],
            requires: ['READ_USERS']
          },
          {
            id: 'REMOVE_USER',
            label: 'Remove',
            description: 'Access to remove users',
            requiredBy: ['WORKSPACE_ADMIN'],
            requires: ['READ_USERS']
          },
          {
            id: 'UPDATE_USER_ROLE',
            label: 'Update',
            description: 'Access to update users',
            requiredBy: ['WORKSPACE_ADMIN'],
            requires: ['READ_USERS']
          }
        ]
      }
    ]
  },
  {
    name: 'Project',
    level: 1,
    description: 'Full access to all project actions',
    permissions: [
      {
        id: 'READ_PROJECT',
        label: 'Read',
        description: 'Access to list projects in a workspace',
        requiredBy: [
          'CREATE_PROJECT',
          'UPDATE_PROJECT',
          'DELETE_PROJECT',
          'WORKSPACE_ADMIN'
        ]
      },
      {
        id: 'CREATE_PROJECT',
        label: 'Create',
        description: 'Access to create projects in a workspace',
        requires: ['READ_PROJECT'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'UPDATE_PROJECT',
        label: 'Update',
        description: 'Access to update projects',
        requires: ['READ_PROJECT'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'DELETE_PROJECT',
        label: 'Delete',
        description: 'Access to delete projects',
        requires: ['READ_PROJECT'],
        requiredBy: ['WORKSPACE_ADMIN']
      }
    ]
  },
  {
    name: 'Environment',
    level: 1,
    description: 'Full access to all environment actions',
    permissions: [
      {
        id: 'READ_ENVIRONMENT',
        label: 'Read',
        description: 'Access to read environments',
        requiredBy: [
          'READ_ENVIRONMENT',
          'UPDATE_ENVIRONMENT',
          'DELETE_ENVIRONMENT',
          'WORKSPACE_ADMIN'
        ]
      },
      {
        id: 'CREATE_ENVIRONMENT',
        label: 'Create',
        description: 'Access to create environments',
        requiredBy: ['WORKSPACE_ADMIN'],
        requires: ['READ_ENVIRONMENT']
      },
      {
        id: 'UPDATE_ENVIRONMENT',
        label: 'Update',
        description: 'Access to update environments',
        requires: ['READ_ENVIRONMENT'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'DELETE_ENVIRONMENT',
        label: 'Delete',
        description: 'Access to delete environments',
        requires: ['READ_ENVIRONMENT'],
        requiredBy: ['WORKSPACE_ADMIN']
      }
    ]
  },
  {
    name: 'Secret',
    level: 1,
    description: 'Full access to all secret actions',
    permissions: [
      {
        id: 'READ_SECRET',
        label: 'Read',
        description: 'Access to read secrets',
        requiredBy: [
          'CREATE_SECRET',
          'UPDATE_SECRET',
          'DELETE_SECRET',
          'WORKSPACE_ADMIN'
        ]
      },
      {
        id: 'CREATE_SECRET',
        label: 'Create',
        description: 'Access to create secrets',
        requires: ['READ_SECRET'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'UPDATE_SECRET',
        label: 'Update',
        description: 'Access to update secrets',
        requires: ['READ_SECRET'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'DELETE_SECRET',
        label: 'Delete',
        description: 'Access to delete secrets',
        requires: ['READ_SECRET'],
        requiredBy: ['WORKSPACE_ADMIN']
      }
    ]
  },
  {
    name: 'Variable',
    level: 1,
    description: 'Full access to all variable actions',
    permissions: [
      {
        id: 'READ_VARIABLE',
        label: 'Read',
        description: 'Access to read variables',
        requiredBy: [
          'CREATE_VARIABLE',
          'UPDATE_VARIABLE',
          'DELETE_VARIABLE',
          'WORKSPACE_ADMIN'
        ]
      },
      {
        id: 'CREATE_VARIABLE',
        label: 'Create',
        description: 'Access to create variables',
        requires: ['READ_VARIABLE'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'UPDATE_VARIABLE',
        label: 'Update',
        description: 'Access to update variables',
        requires: ['READ_VARIABLE'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'DELETE_VARIABLE',
        label: 'Delete',
        description: 'Access to delete variables',
        requires: ['READ_VARIABLE'],
        requiredBy: ['WORKSPACE_ADMIN']
      }
    ]
  },
  {
    name: 'Integrations',
    level: 1,
    description: 'Full access to all integration actions',
    permissions: [
      {
        id: 'READ_INTEGRATION',
        label: 'Read',
        description: 'Access to read integrations',
        requiredBy: [
          'CREATE_INTEGRATION',
          'UPDATE_INTEGRATION',
          'DELETE_INTEGRATION',
          'WORKSPACE_ADMIN'
        ]
      },
      {
        id: 'CREATE_INTEGRATION',
        label: 'Create',
        description: 'Access to create integrations',
        requires: ['READ_INTEGRATION'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'UPDATE_INTEGRATION',
        label: 'Update',
        description: 'Access to update integrations',
        requires: ['READ_INTEGRATION'],
        requiredBy: ['WORKSPACE_ADMIN']
      },
      {
        id: 'DELETE_INTEGRATION',
        label: 'Delete',
        description: 'Access to delete integrations',
        requires: ['READ_INTEGRATION'],
        requiredBy: ['WORKSPACE_ADMIN']
      }
    ]
  },
  {
    name: 'API Key',
    level: 1,
    explicitToApiKey: true,
    description: 'Full access to all API-Key actions',
    permissions: [
      {
        id: 'READ_API_KEY',
        label: 'Read',
        description: 'Access to read API-Key',
        requiredBy: ['CREATE_API_KEY', 'UPDATE_API_KEY', 'DELETE_API_KEY']
      },
      {
        id: 'CREATE_API_KEY',
        label: 'Create',
        description: 'Access to create API-Key',
        requires: ['READ_API_KEY']
      },
      {
        id: 'UPDATE_API_KEY',
        label: 'Update',
        description: 'Access to update API-Key',
        requires: ['READ_API_KEY']
      },
      {
        id: 'DELETE_API_KEY',
        label: 'Delete',
        description: 'Access to delete API-Key',
        requires: ['READ_API_KEY']
      }
    ]
  },
  {
    name: 'Profile',
    level: 1,
    explicitToApiKey: true,
    description: 'Full access to all profile actions',
    permissions: [
      {
        id: 'READ_SELF',
        label: 'Read',
        description: 'Access to read self',
        requiredBy: ['UPDATE_SELF', 'UPDATE_PROFILE']
      },
      {
        id: 'UPDATE_PROFILE',
        label: 'Update',
        description: 'Access to update profile',
        requires: ['READ_SELF']
      },
      {
        id: 'UPDATE_SELF',
        label: 'Delete',
        description: 'Access to update self',
        requires: ['READ_SELF']
      }
    ]
  }
]

interface AuthoritySelectorProps {
  selectedPermissions: Set<AuthorityEnum>
  setSelectedPermissions: React.Dispatch<
    React.SetStateAction<Set<AuthorityEnum>>
  >
  isSheet?: boolean
  parent: 'API_KEY' | 'ROLES'
  isAdminRole?: boolean
}

function extractAuthoritiesFromGroupItem(
  groupItem: GroupItem,
  checked: boolean
): Set<AuthorityEnum> {
  let set = new Set<AuthorityEnum>()

  groupItem.permissions?.forEach(
    (p) =>
      (set = new Set([
        ...set,
        ...extractAuthoritiesFromChecklistItem(p, checked)
      ]))
  )

  if (groupItem.subgroups) {
    groupItem.subgroups.forEach((subgroup) => {
      const subgroupAuthorities = extractAuthoritiesFromGroupItem(
        subgroup,
        checked
      )
      set = new Set([...set, ...subgroupAuthorities])
    })
  }

  return set
}

function extractAuthoritiesFromChecklistItem(
  checklistItem: ChecklistItem,
  checked: boolean
): Set<AuthorityEnum> {
  const set = new Set<AuthorityEnum>()

  set.add(checklistItem.id)

  if (checked) {
    checklistItem.requires?.forEach((r) => set.add(r))
  } else {
    checklistItem.requiredBy?.forEach((r) => set.add(r))
  }

  return set
}

export default function AuthoritySelector({
  selectedPermissions,
  setSelectedPermissions,
  isSheet,
  isAdminRole,
  parent
}: AuthoritySelectorProps): React.JSX.Element {
  const handleGroupToggle = (groupItem: GroupItem, checked: boolean) => {
    const authorities = extractAuthoritiesFromGroupItem(groupItem, checked)

    if (checked) {
      setSelectedPermissions((prev) => new Set([...prev, ...authorities]))
    } else {
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev)
        authorities.forEach((authority) => newSet.delete(authority))
        return newSet
      })
    }
  }

  const handleChecklistItemToggle = (
    checklistItem: ChecklistItem,
    checked: boolean
  ) => {
    const authorities = extractAuthoritiesFromChecklistItem(
      checklistItem,
      checked
    )

    if (checked) {
      setSelectedPermissions((prev) => new Set([...prev, ...authorities]))
    } else {
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev)
        authorities.forEach((authority) => newSet.delete(authority))
        return newSet
      })
    }
  }

  const isGroupSelected = (groupItem: GroupItem) => {
    return groupItem.permissions?.every((p) => selectedPermissions.has(p.id))
  }

  const isItemSelected = (id: AuthorityEnum) => {
    return selectedPermissions.has(id)
  }

  function renderAuthorityGroupsRecursively(
    currentLevel: number,
    group: GroupItem
  ) {
    return (
      <div key={group.name}>
        <div className={`ml-[${currentLevel * 20}px]`} key={group.name}>
          <div
            className="flex cursor-pointer flex-col gap-2 rounded-md p-2 hover:bg-white/5"
            onClick={() => handleGroupToggle(group, !isGroupSelected(group))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleGroupToggle(group, !isGroupSelected(group))
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isGroupSelected(group)}
                className="rounded-[4px] border border-[#18181B] bg-[#71717A] text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
                data-state={isGroupSelected(group) ? 'checked' : 'unchecked'}
                id={group.name}
              />
              <label className="min-w-40 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {group.name}
              </label>
            </div>
            <div className="">
              <p className="max-w-10 whitespace-nowrap text-xs text-zinc-400">
                {group.description}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-3">
            {group.permissions
              ?.filter((permission) => {
                if (permission.explicitToApiKey) {
                  return parent === 'API_KEY'
                }
                return true
              })
              .map((permission) => (
                <div
                  className="mb-2 ml-4 flex cursor-pointer flex-col rounded-[4px] p-2 transition-all duration-150 hover:bg-white/10"
                  key={String(permission.id)}
                  onClick={() =>
                    handleChecklistItemToggle(
                      permission,
                      !isItemSelected(permission.id)
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleChecklistItemToggle(
                        permission,
                        !isItemSelected(permission.id)
                      )
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isItemSelected(permission.id)}
                      className="rounded-[4px] border border-[#18181B] bg-[#71717A] data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
                      data-state={
                        isItemSelected(permission.id) ? 'checked' : 'unchecked'
                      }
                      id={String(permission.id)}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {permission.label}
                    </label>
                  </div>
                  <p className="ml-6 text-xs text-zinc-400">
                    {permission.description}
                  </p>
                </div>
              ))}
          </div>
        </div>
        {group.subgroups?.map((subgroup) =>
          renderAuthorityGroupsRecursively(currentLevel + 1, subgroup)
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex items-start justify-start ${isSheet ? 'flex-col gap-y-3' : 'flex-row gap-6'} h-full`}
    >
      <label className="w-[9rem] text-base font-semibold" htmlFor="authorities">
        Authorities
      </label>
      <div
        className={cn('mt-2 h-full w-full space-y-4', {
          'pointer-events-none cursor-none opacity-50': isAdminRole
        })}
      >
        {authorityGroups
          .filter((group) => {
            if (group.explicitToApiKey) {
              return parent === 'API_KEY'
            }
            return true
          })
          .map((group) => renderAuthorityGroupsRecursively(0, group))}
      </div>
    </div>
  )
}
