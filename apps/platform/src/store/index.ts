import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type {
  ApiKey,
  Environment,
  EventTypeEnum,
  GetAllEnvironmentsOfProjectResponse,
  GetAllProjectsResponse,
  GetAllWorkspacesOfUserResponse,
  GetMembersResponse,
  Integration,
  Secret,
  SecretVersion,
  User,
  Variable,
  VariableVersion,
  WorkspaceRole
} from '@keyshade/schema'
import type { VercelEnvironmentMapping } from '@keyshade/common'

export const userAtom = atomWithStorage<Partial<User> | null>('user', null)

export const globalSearchDataAtom = atom<{
  workspaces: { id: string; slug: string; name: string; icon: string }[]
  secrets: {
    slug: string
    name: string
    note: string | null
    project?: { slug: string }
  }[]
  variables: {
    slug: string
    name: string
    note: string | null
    project?: { slug: string }
  }[]
  environments: {
    slug: string
    name: string
    description: string | null
    project?: { slug: string }
  }[]
  projects: { slug: string; name: string; description: string }[]
}>({
  workspaces: [],
  secrets: [],
  variables: [],
  environments: [],
  projects: []
})

export const allWorkspacesAtom = atom<GetAllProjectsResponse['items']>([])

type PartialProject = Pick<
  GetAllProjectsResponse['items'][number],
  'slug' | 'storePrivateKey' | 'privateKey'
>

export const integrationFormAtom = atom<{
  name: string
  selectedEvents: Set<EventTypeEnum>
  selectedProjectSlug: GetAllProjectsResponse['items'][number]['slug'] | null
  selectedProject: PartialProject | null
  selectedEnvironments: Environment['slug'][]
  metadata: Record<string, unknown>
  mappings: VercelEnvironmentMapping
  manualPrivateKey: string
}>({
  name: '',
  selectedEvents: new Set<EventTypeEnum>(),
  selectedProjectSlug: null,
  selectedProject: null,
  selectedEnvironments: [],
  metadata: {},
  mappings: {},
  manualPrivateKey: ''
})

export const resetIntegrationFormAtom = atom(null, (get, set) => {
  set(integrationFormAtom, {
    name: '',
    selectedEvents: new Set<EventTypeEnum>(),
    selectedProjectSlug: null,
    selectedProject: null,
    selectedEnvironments: [],
    metadata: {},
    mappings: {},
    manualPrivateKey: ''
  })
})

export const selectedWorkspaceAtom = atom<
  GetAllWorkspacesOfUserResponse['items'][number] | null
>(null)

export const selectedProjectAtom = atom<
  GetAllProjectsResponse['items'][number] | null
>(null)
export const projectsOfWorkspaceAtom = atom<GetAllProjectsResponse['items']>([])

export const membersOfWorkspaceAtom = atom<GetMembersResponse['items']>([])
export const selectedMemberAtom = atom<
  GetMembersResponse['items'][number] | null
>(null)

export const selectedVariableAtom = atom<Variable | null>(null)
export const selectedVariableEnvironmentAtom = atom<Environment['slug'] | null>(
  null
)
export const selectedVariableRollbackVersionAtom = atom<
  VariableVersion['version'] | null
>(null)
export const variablesOfProjectAtom = atom<Variable[]>([])
export const revisionsOfVariableAtom = atom<
  {
    environment: {
      name: string
      slug: string
    }
    versions: VariableVersion[]
  }[]
>([])

export const selectedSecretAtom = atom<Secret | null>(null)
export const selectedSecretEnvironmentAtom = atom<Environment['slug'] | null>(
  null
)
export const selectedSecretRollbackVersionAtom = atom<
  SecretVersion['version'] | null
>(null)
export const secretsOfProjectAtom = atom<Secret[]>([])
export const revisionsOfSecretAtom = atom<
  {
    environment: {
      name: string
      slug: string
    }
    versions: SecretVersion[]
  }[]
>([])

export const selectedEnvironmentAtom = atom<
  GetAllEnvironmentsOfProjectResponse['items'][number] | null
>(null)
export const environmentsOfProjectAtom = atom<
  GetAllEnvironmentsOfProjectResponse['items']
>([])

export const selectedRoleAtom = atom<WorkspaceRole | null>(null)
export const rolesOfWorkspaceAtom = atom<WorkspaceRole[]>([])
export const integrationsOfWorkspaceAtom = atom<Integration[]>([])

export const selectedApiKeyAtom = atom<ApiKey | null>(null)
export const apiKeysOfProjectAtom = atom<ApiKey[]>([])
export const selectedProjectPrivateKeyAtom = atom<string | null>(null)
export const localProjectPrivateKeyAtom = atom<
  {
    slug: Environment['slug']
    key: GetAllProjectsResponse['items'][number]['privateKey']
  }[]
>([])
export const privateKeyStorageTypeAtom = atom<'IN_ATOM' | 'IN_DB' | 'NONE'>(
  'NONE'
)

export const workspaceProjectCountAtom = atom<number>(0)
export const workspaceMemberCountAtom = atom<number>(0)
export const workspaceRolesCountAtom = atom<number>(0)
export const workspaceIntegrationCountAtom = atom<number>(0)
export const projectEnvironmentCountAtom = atom<number>(0)
export const projectSecretCountAtom = atom<number>(0)
export const projectVariableCountAtom = atom<number>(0)

export const createProjectOpenAtom = atom<boolean>(false)
export const editProjectOpenAtom = atom<boolean>(false)
export const deleteProjectOpenAtom = atom<boolean>(false)
export const exportConfigOpenAtom = atom<boolean>(false)

export const createVariableOpenAtom = atom<boolean>(false)
export const editVariableOpenAtom = atom<boolean>(false)
export const deleteVariableOpenAtom = atom<boolean>(false)
export const deleteEnvironmentValueOfVariableOpenAtom = atom<boolean>(false)
export const variableRevisionsOpenAtom = atom<boolean>(false)
export const rollbackVariableOpenAtom = atom<boolean>(false)

export const createSecretOpenAtom = atom<boolean>(false)
export const editSecretOpenAtom = atom<boolean>(false)
export const deleteSecretOpenAtom = atom<boolean>(false)
export const deleteEnvironmentValueOfSecretOpenAtom = atom<boolean>(false)
export const secretRevisionsOpenAtom = atom<boolean>(false)
export const rollbackSecretOpenAtom = atom<boolean>(false)
export const disableSecretOpenAtom = atom<boolean>(false)

export const selectedIntegrationAtom = atom<Integration | null>(null)
export const createIntegrationOpenAtom = atom<boolean>(false)
export const integrationLoadingAtom = atom<boolean>(false)
export const integrationTestingAtom = atom<boolean>(false)
export const createIntegrationTypeAtom = atom<Integration['type'] | null>(null)
export const editIntegrationOpenAtom = atom<boolean>(false)
export const deleteIntegrationOpenAtom = atom<boolean>(false)

export const createEnvironmentOpenAtom = atom<boolean>(false)
export const editEnvironmentOpenAtom = atom<boolean>(false)
export const deleteEnvironmentOpenAtom = atom<boolean>(false)
export const deleteWorkspaceOpenAtom = atom<boolean>(false)
export const leaveWorkspaceOpenAtom = atom<boolean>(false)

export const createApiKeyOpenAtom = atom<boolean>(false)
export const editApiKeyOpenAtom = atom<boolean>(false)
export const deleteApiKeyOpenAtom = atom<boolean>(false)
export const apiKeyOneTimeDisplayDialogOpenAtom = atom<boolean>(false)
export const oneTimeSecretValueAtom = atom<string>('')

export const createRoleOpenAtom = atom<boolean>(false)
export const editRoleOpenAtom = atom<boolean>(false)
export const deleteRoleOpenAtom = atom<boolean>(false)

export const removeMemberOpenAtom = atom<boolean>(false)
export const transferOwnershipOpenAtom = atom<boolean>(false)
export const editMemberOpenAtom = atom<boolean>(false)
export const cancelInviteOpenAtom = atom<boolean>(false)

export const deleteAccountOpenAtom = atom<boolean>(false)

export const viewAndDownloadProjectKeysOpenAtom = atom<boolean>(false)
