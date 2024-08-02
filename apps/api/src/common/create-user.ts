import { AuthProvider, User, Workspace } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from '../user/dto/create.user/create.user'
import createWorkspace from './create-workspace'
import { Logger } from '@nestjs/common'

const createUser = async (
  dto: Partial<CreateUserDto> & { authProvider: AuthProvider },
  prisma: PrismaService
): Promise<User & { defaultWorkspace?: Workspace }> => {
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

export default createUser
