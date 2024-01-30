import { PrismaClient, User } from '@prisma/client'
import { ConflictException } from '@nestjs/common'

export const createUser = async (
  user: Partial<User>,
  prisma: PrismaClient,
  exceptionFlag?: boolean
): Promise<User> => {
  // Check for duplicate user
  const existingUser = await prisma.user.findUnique({
    where: {
      email: user.email
    }
  })

  if (existingUser) {
    if (!exceptionFlag) return existingUser
    throw new ConflictException('User already exists with this email')
  }

  // Create the user
  const newUser: User = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      profilePictureUrl: user.profilePictureUrl,
      isActive: user.isActive ?? true,
      isOnboardingFinished: user.isOnboardingFinished ?? true,
      isAdmin: user.isAdmin ?? false
    }
  })

  // Create the user's default workspace
  await prisma.workspace.create({
    data: {
      name: `My Workspace`,
      description: 'My default workspace',
      isDefault: true,
      ownerId: newUser.id,
      lastUpdatedBy: {
        connect: {
          id: newUser.id
        }
      }
    }
  })

  return newUser
}
