import { User } from '@prisma/client'
import { CreateUserDto } from '../dto/create.user/create.user'

export const USER_REPOSITORY = 'USER_REPOSITORY'

/**
 * Interface for the User Repository.
 */
export interface IUserRepository {
  /**
   * Find a user by email.
   * @param {User['email']} email - The email to search for.
   * @returns {Promise<User | null>} - A promise that resolves to the user if found, null otherwise.
   */
  findUserByEmail(email: User['email']): Promise<User | null>

  /**
   * Find a user by user ID.
   * @param {string} id - The ID of the user to find.
   * @returns {Promise<User | null>} - A promise that resolves to the user if found, null otherwise.
   */
  findUserById(id: string): Promise<User | null>

  /**
   * Find all users with optional pagination, sorting, and search.
   * @param {number} page - The page number.
   * @param {number} limit - The number of items per page.
   * @param {string} sort - The field to sort by.
   * @param {string} order - The sort order ('asc' or 'desc').
   * @param {string} search - The search string.
   * @returns {Promise<User[]>} - A promise that resolves to the list of users.
   */
  findUsers(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<User[]>

  /**
   * Create a user with the given email. The onboarding process will aim at updating the user further.
   * @param {User['email']} email - The email of the user to create.
   * @returns {Promise<User>} - A promise that resolves to the created user.
   */
  createUser(email: User['email']): Promise<User>

  /**
   * Update an existing user.
   * @param {string} id - ID of the user to update.
   * @param {Partial<User>} data - The data to update.
   * @returns {Promise<User>} - A promise that resolves to the updated user.
   */
  updateUser(id: string, data: Partial<User>): Promise<User>

  /**
   * Delete a user by ID.
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<User>} - A promise that resolves to the deleted user.
   */
  deleteUser(id: string): Promise<User>

  /**
   * Create user by admin
   * @returns {Promise<User>} - A promise that resolves to create user.
   */
  createUserByAdmin(user: CreateUserDto): Promise<User>
}
