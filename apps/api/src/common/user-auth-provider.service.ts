import { Injectable, Logger } from '@nestjs/common'
import { AuthProvider, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class UserAuthProviderService {
  private readonly logger = new Logger(UserAuthProviderService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds an auth provider to a user's authProviders array if not already present
   * @param userId - The ID of the user to add the auth provider to
   * @param authProvider - The auth provider to add
   * @returns The updated user
   */
  async addAuthProvider(
    userId: string,
    authProvider: AuthProvider
  ): Promise<User> {
    this.logger.log(`Adding auth provider ${authProvider} to user ${userId}`)

    // Get the user with raw query to access authProviders field
    const userResult = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userResult) {
      throw new Error(`User with ID ${userId} not found`)
    }

    const user = userResult

    // Get current auth providers, fallback to legacy field if new field is empty
    let currentProviders: AuthProvider[] = []

    try {
      // Try to access the new authProviders field
      currentProviders = (user as any).authProviders || []
    } catch {
      // If it doesn't exist yet, use empty array
      currentProviders = []
    }

    // Check if provider already exists
    if (currentProviders.includes(authProvider)) {
      this.logger.log(
        `Auth provider ${authProvider} already exists for user ${userId}`
      )
      return user
    }

    // Add the new provider
    const updatedProviders = [...currentProviders, authProvider]

    this.logger.log(
      `Updating user ${userId} auth providers from [${currentProviders.join(', ')}] to [${updatedProviders.join(', ')}]`
    )

    try {
      // Use ORM to update the authProviders field
      await this.prisma.user.update({
        where: { id: userId },
        data: { authProviders: updatedProviders }
      })

      // Return the updated user
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { authProviders: updatedProviders }
      })
      return updatedUser
    } catch (error) {
      // If new field doesn't exist yet, just log and return the user
      this.logger.warn(
        `Could not update authProviders field for user ${userId}, likely because migration hasn't run yet: ${error.message}`
      )
      return user
    }
  }

  /**
   * Checks if a user has a specific auth provider
   * @param user - The user to check
   * @param authProvider - The auth provider to check for
   * @returns True if the user has the auth provider, false otherwise
   */
  hasAuthProvider(user: any, authProvider: AuthProvider): boolean {
    let currentProviders: AuthProvider[] = []

    try {
      currentProviders = user.authProviders || []
    } catch {
      currentProviders = []
    }

    // Check new array first
    if (currentProviders.includes(authProvider)) {
      return true
    }

    // Fall back to legacy field if array is empty
    if (currentProviders.length === 0 && user.authProvider === authProvider) {
      return true
    }

    return false
  }

  /**
   * Gets all auth providers for a user
   * @param user - The user to get auth providers for
   * @returns Array of auth providers
   */
  getAuthProviders(user: any): AuthProvider[] {
    let currentProviders: AuthProvider[] = []

    try {
      currentProviders = user.authProviders || []
    } catch {
      currentProviders = []
    }

    // Migrate from legacy field if needed
    if (currentProviders.length === 0 && user.authProvider) {
      currentProviders = [user.authProvider]
    }

    return currentProviders
  }

  /**
   * Gets the primary auth provider for backward compatibility
   * @param user - The user to get the primary auth provider from
   * @returns The primary auth provider or null
   */
  getPrimaryAuthProvider(user: any): AuthProvider | null {
    const providers = this.getAuthProviders(user)
    return providers.length > 0 ? providers[0] : null
  }

  /**
   * Note: Migration from legacy authProvider to authProviders array
   * is now handled by SQL migration script instead of this function.
   * See: /apps/api/src/prisma/migrations/20250122000000_migrate_auth_provider_to_auth_providers_array/migration.sql
   */
}
