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
        authProvider: dto.authProvider,
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
        },
        include: {
          emailPreference: true
        }
      })) ??
      (await prisma.user.findUnique({
        where: {
          id: input
        },
        include: {
          emailPreference: true
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
    logger.error(`User not found: ${input}`)
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
