import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'

export const SECRET_REPOSITORY = 'SECRET_REPOSITORY'

export interface ISecretRepository {
  secretExists(
    secretName: Secret['name'],
    environmentId: Environment['id'],
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean>

  createSecret(
    secret: Partial<Secret>,
    projectId: Project['id'],
    environmentId: Environment['id'],
    userId: User['id']
  ): Promise<Secret>

  updateSecret(
    secretId: Secret['id'],
    secret: Partial<Secret>,
    userId: User['id']
  ): Promise<Secret>

  updateVersions(
    secretId: Secret['id'],
    versions: Partial<SecretVersion>[]
  ): Promise<void>

  updateSecretEnvironment(
    secretId: Secret['id'],
    environmentId: Environment['id'],
    userId: User['id']
  ): Promise<Secret>

  rollbackSecret(
    secretId: Secret['id'],
    rollbackVersion: SecretVersion['version']
  ): Promise<void>

  deleteSecret(secretId: Secret['id'], userId: User['id']): Promise<void>

  getSecret(secretId: Secret['id'], projectId: Project['id']): Promise<Secret>

  getAllVersionsOfSecret(secretId: string): Promise<SecretVersion[]>

  getAllSecretsOfProject(
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Secret[]>

  getAllSecrets(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Secret[]>
}
