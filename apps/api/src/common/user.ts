import { AuthProvider, User, Workspace } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '@/user/dto/create.user/create.user'
import { Logger, NotFoundException } from '@nestjs/common'
import { createWorkspace } from './workspace'

/**
 * Creates a new user and optionally creates a default workspace for them.
 * @param dto - The user data to create a user with.
 * @param prisma - The prisma service to use for database operations.
 * @returns The created user and, if the user is not an admin, a default workspace.
 */
export async function createUser(
  dto: Partial<CreateUserDto> & { authProvider: AuthProvider },
  prisma: PrismaService
): Promise<User & { defaultWorkspace?: Workspace }> {
  const logger = new Logger('createUser')

  // Create the user
  const user = await prisma.user.create({
    data: {
      email: dto.email,
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
    return user
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
 * Finds a user by their email address.
 *
 * @param email The email address to search for.
 * @param prisma The Prisma client instance.
 * @returns The user with the given email address, or null if no user is found.
 * @throws NotFoundException if no user is found with the given email address.
 */
export async function getUserByEmail(
  email: User['email'],
  prisma: PrismaService
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (!user) {
    throw new NotFoundException(`User ${email} not found`)
  }

  return user
}
