import { AuthProvider, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '@/user/dto/create.user/create.user'
import { Logger, NotFoundException } from '@nestjs/common'
import { createWorkspace } from './workspace'
import { UserWithWorkspace } from '@/user/user.types'
import { constructErrorBody } from './util'

/**
 * Creates a new user and optionally creates a default workspace for them.
 * @param dto - The user data to create a user with.
 * @param prisma - The prisma service to use for database operations.
 * @returns The created user and, if the user is not an admin, a default workspace.
 */
export async function createUser(
  dto: Partial<CreateUserDto> & { authProvider: AuthProvider; id?: User['id'] },
  prisma: PrismaService
): Promise<UserWithWorkspace> {
  const logger = new Logger('createUser')

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

  if (user.isAdmin) {
    logger.log(`Created admin user ${user.id}`)
    return {
      ...user,
      defaultWorkspace: null
    }
  }

  // Create the user's default workspace
  const workspace = await createWorkspace(
    user,
    { name: 'My Workspace' },
    prisma,
    true
  )

  logger.log(`Created user ${user.id} with default workspace ${workspace.id}`)

  return {
    ...user,
    defaultWorkspace: workspace
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
  const user =
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

  if (!user) {
    throw new NotFoundException(
      constructErrorBody('User not found', `User ${input} not found`)
    )
  }

  const defaultWorkspace = await prisma.workspace.findFirst({
    where: {
      ownerId: user.id,
      isDefault: true
    }
  })

  return {
    ...user,
    defaultWorkspace
  }
}
