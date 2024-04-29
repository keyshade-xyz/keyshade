const createUser = async (
  dto: Partial<CreateUserDto>,
  prisma: PrismaService
): Promise<
  User & {
    defaultWorkspace: Workspace
  } | User
> => {
  const logger = new Logger('createUser')

  // Create the user
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      name: dto.name,
      profilePictureUrl: dto.profilePictureUrl,
      isActive: dto.isActive ?? true,
      isAdmin: dto.isAdmin ?? false,
      isOnboardingFinished: dto.isOnboardingFinished ?? false
    }
  })

  // Check if the user is an admin
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
