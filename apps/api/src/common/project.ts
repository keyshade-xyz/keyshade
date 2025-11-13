import { ProjectAccessLevel, Workspace } from '@prisma/client'
import { createKeyPair, sEncrypt } from '@/common/cryptography'
import { CreateProject } from '@/project/dto/create.project/create.project'
import { PrismaService } from '@/prisma/prisma.service'
import { Logger } from '@nestjs/common'
import SlugGenerator from './slug-generator.service'
import { HydratedProject } from '@/project/project.types'
import { HydrationService } from './hydration.service'
import { InclusionQuery } from './inclusion-query'
import { AuthenticatedUser } from '@/user/user.types'
import { v4 } from 'uuid'

/**
 * Creates a new project for a given workspace
 * @param user The user creating the project
 * @param workspaceSlug The slug of the workspace where the project would be created
 * @param dto The project data
 * @param authorizationService The AuthorizationService instance
 * @param prisma The Prisma client
 * @param slugGenerator
 * @returns The created project
 */
export const createProject = async (
  user: AuthenticatedUser,
  workspaceSlug: Workspace['slug'],
  dto: CreateProject,
  prisma: PrismaService,
  slugGenerator: SlugGenerator,
  hydrationService: HydrationService
): Promise<HydratedProject> => {
  const logger = new Logger('createProject')

  logger.log(
    `Attempting to create project ${dto.name} for workspace ${workspaceSlug}`
  )

  logger.log(`Checking if workspace ${workspaceSlug} exists`)
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: workspaceSlug
    }
  })
  const workspaceId = workspace.id

  // Create the public and private key pair
  logger.log(`Creating key pair for project ${dto.name}`)
  const { publicKey, privateKey } = createKeyPair()

  const data: any = {
    name: dto.name,
    slug: await slugGenerator.generateEntitySlug(dto.name, 'PROJECT'),
    description: dto.description,
    storePrivateKey:
      dto.accessLevel === ProjectAccessLevel.GLOBAL
        ? true
        : dto.storePrivateKey, // If the project is global, the private key must be stored
    publicKey,
    accessLevel: dto.accessLevel
  }

  // Check if the private key should be stored
  // PLEASE DON'T STORE YOUR PRIVATE KEYS WITH US!!
  if (dto.storePrivateKey) {
    logger.log(`Storing private key for project ${dto.name}`)
    data.privateKey = sEncrypt(privateKey)
  } else {
    logger.log(`Not storing private key for project ${dto.name}`)
  }

  const userId = user.id

  const newProjectId = v4()

  logger.log(`Creating project ${dto.name} under workspace ${workspaceSlug}`)
  const createNewProject = prisma.project.create({
    data: {
      id: newProjectId,
      ...data,
      workspace: {
        connect: {
          id: workspaceId
        }
      },
      lastUpdatedBy: {
        connect: {
          id: userId
        }
      }
    },
    include: InclusionQuery.Project
  })

  const createEnvironmentOps = []
  const newEnvironmentSlugs = []

  logger.log(`Creating default environment for project ${dto.name}`)
  const environmentSlug = await slugGenerator.generateEntitySlug(
    'default',
    'ENVIRONMENT'
  )

  newEnvironmentSlugs.push(environmentSlug)
  createEnvironmentOps.push(
    prisma.environment.create({
      data: {
        name: 'default',
        slug: await slugGenerator.generateEntitySlug('default', 'ENVIRONMENT'),
        description: 'Default environment for the project',
        projectId: newProjectId,
        lastUpdatedById: user.id
      }
    })
  )

  const result = await prisma.$transaction([
    createNewProject,
    ...createEnvironmentOps
  ])

  const newProject = result[0]

  logger.debug(`Created project ${newProject.name} (${newProject.slug})`)

  return await hydrationService.hydrateProject({
    project: newProject,
    user
  })
}
