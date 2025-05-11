import { AuthProvider, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '@/user/dto/create.user/create.user'
import {
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { createWorkspace } from './workspace'
import { UserWithWorkspace } from '@/user/user.types'
import { constructErrorBody } from './util'
import SlugGenerator from './slug-generator.service'

/**
 * Creates a new user and optionally creates a default workspace for them.
 * @param dto - The user data to create a user with.
 * @param prisma - The prisma service to use for database operations.
 * @returns The created user and, if the user is not an admin, a default workspace.
 */
export async function createUser(
  dto: Partial<CreateUserDto> & { authProvider: AuthProvider; id?: User['id'] },
  prisma: PrismaService,
  slugGenerator: SlugGenerator
): Promise<UserWithWorkspace> {
  const logger = new Logger('createUser')

  logger.log(`Creating user: ${dto.email}`)
  try {
    // Create the user
    const user = await prisma.user.create({
      data: {
        id: dto.id,
        email: dto.email.toLowerCase(),
        name: dto.name,
        profilePictureUrl: dto.profilePictureUrl,
        isActive: dto.isActive ?? true,
        isAdmin: dto.isAdmin ?? false,
        isOnboardingFinished: dto.isOnboardingFinished ?? false,
        authProvider: dto.authProvider
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
      user,
      { name: 'My Workspace' },
      prisma,
      slugGenerator
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
        'An error occurred while creating the user.'
      )
    )
  }
}

/**
 * Finds a user by their email or ID.
 * @param input The email or ID of the user to find.
 * @param prisma The Prisma client to use for the database operation.
 * @throws {NotFoundException} If the user is not found.
 * @returns The user with their default workspace.
 */
export async function getUserByEmailOrId(
  input: User['email'] | User['id'],
  prisma: PrismaService
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
    const defaultWorkspace = await prisma.workspace.findFirst({
      where: {
        ownerId: user.id,
        isDefault: true
      }
    })

    if (!defaultWorkspace) {
      logger.error(`Default workspace not found for user ${user.id}`)
      throw new NotFoundException(
        constructErrorBody(
          'Default workspace not found',
          'We could not find your default workspace. Please get in touch with us.'
        )
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
