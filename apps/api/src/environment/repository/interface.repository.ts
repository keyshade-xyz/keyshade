import { Environment, Project, User } from '@prisma/client'

export const ENVIRONMENT_REPOSITORY = 'ENVIRONMENT_REPOSITORY'

/**
 * Repository interface for handling Environment-related operations.
 */
export interface IEnvironmentRepository {
  /**
   * Creates a new environment for a project.
   * @param {Partial<Environment>} environment - The environment data.
   * @param {Project['id']} projectId - The ID of the project to which the environment belongs.
   * @param {User['id']} userId - The ID of the user creating the environment.
   * @returns {Promise<Environment>} - A promise that resolves to the created environment.
   */
  createEnvironment(
    environment: Partial<Environment>,
    projectId: Project['id'],
    userId: User['id']
  ): Promise<Environment>

  /**
   * Checks if an environment with the given name exists for a specific project.
   * @param {string} environmentName - The name of the environment.
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the environment exists.
   */
  environmentExists(
    environmentName: string,
    projectId: Project['id']
  ): Promise<boolean>

  /**
   * Retrieves the default environment of a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<Environment | null>} - A promise that resolves to the default environment or null if not found.
   */
  getDefaultEnvironmentOfProject(
    projectId: Project['id']
  ): Promise<Environment | null>

  /**
   * Retrieves an environment by project ID and environment ID.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {Environment['id']} environmentId - The ID of the environment.
   * @returns {Promise<Environment | null>} - A promise that resolves to the retrieved environment or null if not found.
   */
  getEnvironmentByProjectIdAndId(
    projectId: Project['id'],
    environmentId: Environment['id']
  ): Promise<Environment | null>

  /**
   * Retrieves environments of a project with optional pagination, sorting, and search.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of environments per page.
   * @param {string} sort - The field to sort by.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @param {string} search - The search term for environment names.
   * @returns {Promise<Environment[]>} - A promise that resolves to an array of environments.
   */
  getEnvironmentsOfProject(
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Environment[]>

  /**
   * Retrieves all environments with optional pagination, sorting, and search.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of environments per page.
   * @param {string} sort - The field to sort by.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @param {string} search - The search term for environment names.
   * @returns {Promise<Environment[]>} - A promise that resolves to an array of environments.
   */
  getEnvironments(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Environment[]>

  /**
   * Updates an existing environment.
   * @param {Environment['id']} environmentId - The ID of the environment to update.
   * @param {Partial<Environment>} environment - The updated environment data.
   * @param {User['id']} userId - The ID of the user updating the environment.
   * @returns {Promise<Environment>} - A promise that resolves to the updated environment.
   */
  updateEnvironment(
    environmentId: Environment['id'],
    environment: Partial<Environment>,
    userId: User['id']
  ): Promise<Environment>

  /**
   * Makes all the environments in this project non-default
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<Environment | null>} - A promise that resolves to the default environment or null if not found.
   */
  makeAllNonDefault(projectId: Project['id']): Promise<void>

  /**
   * Deletes an environment.
   * @param {Environment['id']} environmentId - The ID of the environment to delete.
   * @returns {Promise<void>} - A promise that resolves when the environment is successfully deleted.
   */
  deleteEnvironment(environmentId: Environment['id']): Promise<void>

  /**
   * Get the total number of environments in a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<void>} - A promise that resolves when the total environments are fetched.
   */
  countTotalEnvironmentsInProject(projectId: Project['id']): Promise<number>
}
