import { User } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from '../user/dto/create.user/create.user'

const createUser = async (
  dto: Partial<CreateUserDto>,
  prisma: PrismaService
): Promise<User> => {
  // Create the user
  return await prisma.user.create({
    data: {
      email: dto.email,
      name: dto.name,
      profilePictureUrl: dto.profilePictureUrl,
      isActive: dto.isActive ?? true,
      isAdmin: dto.isAdmin ?? false,
      isOnboardingFinished: dto.isOnboardingFinished ?? false
    }
  })
}

export default createUser
