import { ApiKey, ApiKeyProjectRole, ProjectScope, User } from '@prisma/client'
import { ApiKeyWithProjectScopes } from '../api-key.types'

export const API_KEY_REPOSITORY = 'API_KEY_REPOSITORY'

/**
 * Interface for the ApiKey Repository.
 */
export interface IApiKeyRepository {
  /**
   * Creates a new API key for a user.
   * @param {User} user - The user for whom the API key is created.
   * @param {Partial<ApiKey>} apiKey - The data for the new API key.
   * @returns {Promise<ApiKey>} - A promise that resolves to the created API key.
   */
  createApiKey(user: User, apiKey: Partial<ApiKey>): Promise<ApiKey>

  /**
   * Updates an existing API key.
   * @param {ApiKey['id']} apiKeyId - The ID of the API key to update.
   * @param {ApiKeyWithProjectScopes} apiKey - The updated API key data.
   * @returns {Promise<ApiKey>} - A promise that resolves to the updated API key.
   */
  updateApiKey(
    apiKeyId: ApiKey['id'],
    apiKey: ApiKeyWithProjectScopes
  ): Promise<ApiKey>

  /**
   * Updates the roles of a project scope. If the roles array is empty, the project scope is deleted.
   * @param {User['id']} userId - The ID of the user.
   * @param {ProjectScope['projectId']} projectId - The ID of the project.
   * @param {ApiKeyProjectRole[]} roles - The new roles of the project scope.
   * @returns {Promise<void>} - A promise that resolves when the roles are successfully updated.
   */
  updateRolesOfProjectScope(
    userId: User['id'],
    projectId: ProjectScope['projectId'],
    roles: ApiKeyProjectRole[]
  ): Promise<void>

  /**
   * Deletes an API key.
   * @param {ApiKey['id']} apiKeyId - The ID of the API key to delete.
   * @returns {Promise<void>} - A promise that resolves when the API key is successfully deleted.
   */
  deleteApiKey(apiKeyId: ApiKey['id']): Promise<void>

  /**
   * Finds an API key by its value.
   * @param {ApiKey['value']} apiKeyValue - The value of the API key to find.
   * @returns {Promise<ApiKey | null>} - A promise that resolves to the found API key or null if not found.
   */
  findApiKeyByValue(apiKeyValue: ApiKey['value']): Promise<ApiKey | null>

  /**
   * Finds an API key by its ID and user ID.
   * @param {ApiKey['id']} apiKeyId - The ID of the API key to find.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<ApiKey | null>} - A promise that resolves to the found API key or null if not found.
   */
  findApiKeyByIdAndUserId(
    apiKeyId: ApiKey['id'],
    userId: User['id']
  ): Promise<ApiKey | null>

  /**
   * Finds all API keys for a user.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<ApiKey[]>} - A promise that resolves to an array of API keys for the user.
   */
  findAllApiKeysByUserId(userId: User['id']): Promise<ApiKey[]>
}
