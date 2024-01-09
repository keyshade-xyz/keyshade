import { Project, ProjectMember, ProjectRole, User } from '@prisma/client'
import {
  ProjectWithMembersAndSecrets,
  ProjectWithSecrets,
  ProjectWithUserRole
} from '../project.types'

export const PROJECT_REPOSITORY = 'PROJECT_REPOSITORY'

/**
 * Interface for the Project Repository.
 */
export interface IProjectRepository {
  /**
   * Checks if a project with the given name exists for the specified user.
   * @param {string} projectName - The name of the project.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the project exists.
   */
  projectExists(projectName: string, userId: User['id']): Promise<boolean>

  /**
   * Creates a new project.
   * @param {Partial<Project>} project - The project data.
   * @param {User['id']} userId - The ID of the user creating the project.
   * @returns {Promise<Project>} - A promise that resolves to the created project.
   */
  createProject(project: Partial<Project>, userId: User['id']): Promise<Project>

  /**
   * Updates an existing project.
   * @param {Project['id']} projectId - The ID of the project to update.
   * @param {Partial<Project>} project - The updated project data.
   * @param {User['id']} userId - The ID of the user updating the project.
   * @returns {Promise<Project>} - A promise that resolves to the updated project.
   */
  updateProject(
    projectId: Project['id'],
    project: Partial<Project>,
    userId: User['id']
  ): Promise<Project>

  /**
   * Deletes a project.
   * @param {Project['id']} projectId - The ID of the project to delete.
   * @returns {Promise<void>} - A promise that resolves when the project is successfully deleted.
   */
  deleteProject(projectId: Project['id']): Promise<void>

  /**
   * Adds a member to a project with the specified role.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {User['id']} userId - The ID of the user to add as a member.
   * @param {ProjectRole} role - The role of the user in the project.
   * @returns {Promise<ProjectMember>} - A promise that resolves to the added project member.
   */
  addMemberToProject(
    projectId: Project['id'],
    userId: User['id'],
    role: ProjectRole
  ): Promise<ProjectMember>

  /**
   * Removes a member from a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {User['id']} userId - The ID of the user to remove from the project.
   * @returns {Promise<void>} - A promise that resolves when the user is successfully removed from the project.
   */
  removeMemberFromProject(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<void>

  /**
   * Updates the role of a member in a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {User['id']} userId - The ID of the user whose role needs to be updated.
   * @param {ProjectRole} role - The new role for the user in the project.
   * @returns {Promise<ProjectMember>} - A promise that resolves to the updated project member.
   */
  updateMembership(
    projectId: Project['id'],
    userId: User['id'],
    data: Partial<Pick<ProjectMember, 'role' | 'invitationAccepted'>>
  ): Promise<ProjectMember>

  /**
   * Checks if a user is a member of a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the user is a member of the project.
   */
  memberExistsInProject(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean>

  /**
   * Checks if a user has a pending invitation to a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the user has a pending invitation to the project.
   */
  invitationPending(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean>

  /**
   * Retrieves a project membership by project ID and user ID.
   * @param {Project['id']} projectId - The ID of the project.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<ProjectMember | null>} - A promise that resolves to the project membership or null if not found.
   */
  deleteMembership(projectId: Project['id'], userId: User['id']): Promise<void>

  /**
   * Retrieves a project by user ID and project ID.
   * @param {User['id']} userId - The ID of the user.
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<ProjectWithSecrets | null>} - A promise that resolves to the project or null if not found.
   */
  getProjectByUserIdAndId(
    userId: User['id'],
    projectId: Project['id']
  ): Promise<ProjectWithMembersAndSecrets | null>

  /**
   * Retrieves a project by ID.
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<ProjectWithSecrets | null>} - A promise that resolves to the project or null if not found.
   */
  getProjectById(projectId: Project['id']): Promise<ProjectWithSecrets | null>

  /**
   * Retrieves projects of a user with optional pagination, sorting, and search.
   * @param {User['id']} userId - The ID of the user.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of projects per page.
   * @param {string} sort - The field to sort by.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @param {string} search - The search term for project names or descriptions.
   * @returns {Promise<Array<ProjectWithUserRole>>} - A promise that resolves to an array of projects and permission.
   */
  getProjectsOfUser(
    userId: User['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Array<ProjectWithUserRole>>

  /**
   * Retrieves projects with optional pagination, sorting, and search.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of projects per page.
   * @param {string} sort - The field to sort by.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @param {string} search - The search term for project names or descriptions.
   * @returns {Promise<Project[]>} - A promise that resolves to an array of projects.
   */
  getProjects(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Project[]>

  /**
   * Retrieves project memberships of a user.
   * @param {User['id']} userId - The ID of the user.
   * @returns {Promise<ProjectMember[]>} - A promise that resolves to an array of project memberships.
   */
  getProjectMembershipsOfUser(userId: User['id']): Promise<ProjectMember[]>

  /**
   * Retrieves members of a project.
   * @param {Project['id']} projectId - The ID of the project.
   * @returns {Promise<ProjectMember[]>} - A promise that resolves to an array of project members.
   */
  getMembersOfProject(
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<
    {
      id: string
      role: ProjectRole
      user: User
      invitationAccepted: boolean
    }[]
  >
}
