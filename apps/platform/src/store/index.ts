import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type {
  ApiKey,
  Environment,
  GetAllEnvironmentsOfProjectResponse,
  ProjectWithTierLimitAndCount,
  Secret,
  SecretVersion,
  User,
  Variable,
  VariableVersion,
  WorkspaceRole,
  WorkspaceWithTierLimitAndProjectCount
} from '@keyshade/schema'

export const userAtom = atomWithStorage<Partial<User> | null>('user', null)

export const allWorkspacesAtom = atom<WorkspaceWithTierLimitAndProjectCount[]>(
  []
)
export const selectedWorkspaceAtom =
  atom<WorkspaceWithTierLimitAndProjectCount | null>(null)

export const selectedProjectAtom = atom<ProjectWithTierLimitAndCount | null>(
  null
)
export const projectsOfWorkspaceAtom = atom<ProjectWithTierLimitAndCount[]>([])

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

export const rolesOfWorkspaceAtom = atom<WorkspaceRole[]>([])

export const selectedApiKeyAtom = atom<ApiKey | null>(null)
export const apiKeysOfProjectAtom = atom<ApiKey[]>([])
export const selectedProjectPrivateKeyAtom = atom<string | null>(null)
export const localProjectPrivateKeyAtom = atom<
  {
    slug: Environment['slug']
    key: ProjectWithTierLimitAndCount['privateKey']
  }[]
>([])

export const createProjectOpenAtom = atom<boolean>(false)
export const editProjectOpenAtom = atom<boolean>(false)
export const deleteProjectOpenAtom = atom<boolean>(false)

export const createVariableOpenAtom = atom<boolean>(false)
export const editVariableOpenAtom = atom<boolean>(false)
export const deleteVariableOpenAtom = atom<boolean>(false)
export const deleteEnvironmentValueOfVariableOpenAtom = atom<boolean>(false)
export const variableRevisionsOpenAtom = atom<boolean>(false)
export const rollbackVariableOpenAtom = atom<boolean>(false)

export const createSecretOpenAtom = atom<boolean>(false)
export const editSecretOpenAtom = atom<boolean>(false)
export const shouldRevealSecretEnabled = atom<boolean>(false)
export const deleteSecretOpenAtom = atom<boolean>(false)
export const deleteEnvironmentValueOfSecretOpenAtom = atom<boolean>(false)
export const secretRevisionsOpenAtom = atom<boolean>(false)
export const rollbackSecretOpenAtom = atom<boolean>(false)

export const createEnvironmentOpenAtom = atom<boolean>(false)
export const editEnvironmentOpenAtom = atom<boolean>(false)
export const deleteEnvironmentOpenAtom = atom<boolean>(false)
export const deleteWorkspaceOpenAtom = atom<boolean>(false)

export const createApiKeyOpenAtom = atom<boolean>(false)
export const editApiKeyOpenAtom = atom<boolean>(false)
export const deleteApiKeyOpenAtom = atom<boolean>(false)
export const apiKeyOneTimeDisplayDialogOpenAtom = atom<boolean>(false)
export const oneTimeSecretValueAtom = atom<string>('')

export const createRolesOpenAtom = atom<boolean>(false)
export const editRolesOpenAtom = atom<boolean>(false)
export const deleteRolesOpenAtom = atom<boolean>(false)

export const deleteAccountOpenAtom = atom<boolean>(false)

export const viewAndDownloadProjectKeysOpenAtom = atom<boolean>(false)
