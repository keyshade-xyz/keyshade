import { AuthProvider, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '@/user/dto/create.user/create.user'
import {
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { createWorkspace } from './workspace'
import { AuthenticatedUser, UserWithWorkspace } from '@/user/user.types'
import { constructErrorBody, generateReferralCode } from './util'
import SlugGenerator from './slug-generator.service'
import { HydrationService } from './hydration.service'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'

/**
 * Adds an auth provider to a user's authProviders array if not already present
 * @param user - The user to add the auth provider to
 * @param authProvider - The auth provider to add
 * @returns Updated authProviders array
 */
export function addAuthProvider(
  user: any,
  authProvider: AuthProvider
): AuthProvider[] {
  const currentProviders = user.authProviders || []

  // Check if provider already exists
  if (currentProviders.includes(authProvider)) {
    return currentProviders
  }

  // Add the new provider
  return [...currentProviders, authProvider]
}

/**
 * Checks if a user has a specific auth provider
 * @param user - The user to check
 * @param authProvider - The auth provider to check for
 * @returns True if the user has the auth provider, false otherwise
 */
export function hasAuthProvider(
  user: any,
  authProvider: AuthProvider
): boolean {
  const currentProviders = user.authProviders || []

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
 * Gets the primary auth provider for backward compatibility
 * Prefers the first provider in authProviders array, falls back to legacy authProvider field
 * @param user - The user to get the primary auth provider from
 * @returns The primary auth provider or null
 */
export function getPrimaryAuthProvider(user: any): AuthProvider | null {
  const currentProviders = user.authProviders || []

  // Return first provider from new array if available
  if (currentProviders.length > 0) {
    return currentProviders[0]
  }

  // Fall back to legacy field for backward compatibility
  return user.authProvider || null
}

/**
 * Migrates legacy authProvider to authProviders array
 * @param user - The user to migrate
 * @returns Updated authProviders array
 */
export function migrateAuthProvider(user: any): AuthProvider[] {
  const currentProviders = user.authProviders || []

  // If authProviders is empty but authProvider exists, migrate it
  if (currentProviders.length === 0 && user.authProvider) {
    return [user.authProvider]
  }

  return currentProviders
}

/**
 * Creates a new user and optionally creates a default workspace for them.
 * @param dto - The user data to create a user with.
 * @param prisma - The prisma service to use for database operations.
 * @param slugGenerator
 * @param hydrationService
 * @param workspaceCacheService
 * @returns The created user and, if the user is not an admin, a default workspace.
 */
export async function createUser(
  dto: Partial<CreateUserDto> & { authProvider: AuthProvider; id?: User['id'] },
  prisma: PrismaService,
  slugGenerator: SlugGenerator,
  hydrationService: HydrationService,
  workspaceCacheService: WorkspaceCacheService
): Promise<UserWithWorkspace> {
  const logger = new Logger('createUser')

  logger.log(`Creating user: ${dto.email}`)
  try {
    const referralCode = await generateReferralCode(prisma)

    // Create the user
    const user = await prisma.user.create({
      data: {
        id: dto.id,
        email: dto.email.toLowerCase(),
        name: dto.name,
        referralCode,
        profilePictureUrl: dto.profilePictureUrl,
        isActive: dto.isActive ?? true,
        isAdmin: dto.isAdmin ?? false,
        isOnboardingFinished: dto.isOnboardingFinished ?? false,
        authProvider: dto.authProvider, // Keep for backward compatibility
        authProviders: [dto.authProvider], // New array field
        emailPreference: {
          create: {
            marketing: true,
            activity: true,
            critical: true
          }
        }
      }
    })
    logger.log(`Created user ${user.id}`)

    // If the user is an admin, return the user without a default workspace
    logger.log(`Checking if user is an admin: ${user.id}`)
    if (user.isAdmin) {
      logger.log(`Created admin user ${user.id}. No default workspace needed.`)
      return {
        ...user,
        defaultWorkspace: null
      }
    }

    // Create the user's default workspace
    logger.log(`User ${user.id} is not an admin. Creating default workspace.`)
    const workspace = await createWorkspace(
      user as AuthenticatedUser, // Doesn't harm us
      { name: 'My Workspace' },
      prisma,
      slugGenerator,
      hydrationService,
      workspaceCacheService,
      true
    )
    logger.log(`Created user ${user.id} with default workspace ${workspace.id}`)

    return {
      ...user,
      defaultWorkspace: workspace
    }
  } catch (error) {
    logger.error(`Error creating user: ${error}`)
    throw new InternalServerErrorException(
      constructErrorBody(
        'Error creating user',
        'An error occurred while creating the user'
      )
    )
  }
}

/**
 * Finds a user by their email or ID.
 * @param input The email or ID of the user to find.
 * @param prisma The Prisma client to use for the database operation.
 * @param slugGenerator
 * @param hydrationService
 * @param workspaceCacheService
 * @throws {NotFoundException} If the user is not found.
 * @returns The user with their default workspace.
 */
export async function getUserByEmailOrId(
  input: User['email'] | User['id'],
  prisma: PrismaService,
  slugGenerator: SlugGenerator,
  hydrationService: HydrationService,
  workspaceCacheService: WorkspaceCacheService
): Promise<UserWithWorkspace> {
  const logger = new Logger('getUserByEmailOrId')

  logger.log(`Getting user by email or ID: ${input}`)

  let user: User

  try {
    user =
      (await prisma.user.findUnique({
        where: {
          email: input.toLowerCase()
        }
      })) ??
      (await prisma.user.findUnique({
        where: {
          id: input
        }
      }))
  } catch (error) {
    logger.error(`Error getting user by email or ID: ${input}`)
    throw new InternalServerErrorException(
      constructErrorBody(
        'Error getting user',
        'An error occurred while getting the user.'
      )
    )
  }

  if (!user) {
    logger.warn(`User not found: ${input}`)
    throw new NotFoundException(
      constructErrorBody('User not found', `User ${input} not found`)
    )
  }

  logger.log(`Got user ${user.id}`)

  if (user.isAdmin) {
    logger.log(`User ${user.id} is an admin. No default workspace needed.`)
    return {
      ...user,
      defaultWorkspace: null
    }
  } else {
    logger.log(
      `User ${user.id} is a regular user. Getting default workspace for user ${user.id}`
    )
    let defaultWorkspace = await prisma.workspace.findFirst({
      where: {
        ownerId: user.id,
        isDefault: true
      }
    })

    if (!defaultWorkspace) {
      logger.warn(`Default workspace not found for user ${user.id}`)

      // Create the user's default workspace
      logger.log(
        `User ${user.id} has no default workspace. Creating default workspace.`
      )
      defaultWorkspace = await createWorkspace(
        user as AuthenticatedUser, // Doesn't harm us
        { name: 'My Workspace' },
        prisma,
        slugGenerator,
        hydrationService,
        workspaceCacheService,
        true
      )
      logger.log(
        `Created user ${user.id} with default workspace ${defaultWorkspace.id}`
      )
    }

    logger.log(
      `Got default workspace ${defaultWorkspace.id} for user ${user.id}`
    )

    return {
      ...user,
      defaultWorkspace
    }
  }
}
