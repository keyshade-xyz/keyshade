import { BadRequestException } from '@nestjs/common'
import { Authority, Environment, Project } from '@prisma/client'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthenticatedUser } from '@/user/user.types'
import { constructErrorBody } from './util'
import { CreateEnvironment } from '@/environment/dto/create.environment/create.environment'
import { PrismaService } from '@/prisma/prisma.service'
import { HydrationService } from './hydration.service'
import { HydratedEnvironment } from '@/environment/environment.types'
import { Logger } from '@nestjs/common'
import SlugGenerator from './slug-generator.service'
import { InclusionQuery } from './inclusion-query'

/**
 * Given a list of environment slugs in a CreateSecret, UpdateSecret, CreateVariable, or UpdateVariable DTO,
 * this function checks if the user has access to all the environments and if the environments belong to the given project.
 * If all the checks pass, it returns a Map of environment slug to environment ID.
 *
 * @param environmentSlugs The list of environment slugs
 * @param user The user making the request
 * @param project The project that the environments must belong to
 * @param authorizationService The AuthorizationService instance
 * @param shouldCreateRevisions If not set, the function will return an empty Map
 *
 * @throws NotFoundException if any of the environments do not exist
 * @throws BadRequestException if any of the environments do not belong to the given project
 *
 * @returns A Map of environment slug to environment ID
 */
export const getEnvironmentIdToSlugMap = async (
  environmentSlugs: Array<Environment['slug']>,
  user: AuthenticatedUser,
  project: Partial<Project>,
  authorizationService: AuthorizationService,
  shouldCreateRevisions: boolean
): Promise<Map<string, string>> => {
  const environmentSlugToIdMap = new Map<string, string>()

  const uniqueEnvironmentSlugs = new Set<Environment['slug']>()
  for (const environmentSlug of environmentSlugs) {
    uniqueEnvironmentSlugs.add(environmentSlug)
  }

  if (!shouldCreateRevisions) return environmentSlugToIdMap

  // Check if the user has access to the environments
  for (const environmentSlug of uniqueEnvironmentSlugs.values()) {
    const environment =
      await authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.READ_ENVIRONMENT]
      })

    // Check if the environment belongs to the project
    if (environment.projectId !== project.id) {
      throw new BadRequestException(
        constructErrorBody(
          'Environment does not belong to the project',
          `Environment ${environmentSlug} does not belong to project ${project.slug}`
        )
      )
    }

    environmentSlugToIdMap.set(environmentSlug, environment.id)
  }

  return environmentSlugToIdMap
}

export const createEnvironment = async (
  user: AuthenticatedUser,
  dto: CreateEnvironment,
  projectSlug: Project['slug'],
  prisma: PrismaService,
  slugGenerator: SlugGenerator,
  hydrationService: HydrationService
): Promise<HydratedEnvironment> => {
  const logger = new Logger('createEnvironment')

  logger.log(
    `Attempting to create new environment ${dto.name} for project ${projectSlug}`
  )

  const project = await prisma.project.findUnique({
    where: {
      slug: projectSlug
    }
  })
  const projectId = project.id

  logger.log(`Creating environment ${dto.name} in project ${project.name}`)

  const environmentSlug = await slugGenerator.generateEntitySlug(
    dto.name,
    'ENVIRONMENT'
  )

  const environment = await prisma.environment.create({
    data: {
      name: dto.name,
      slug: environmentSlug,
      description: dto.description,
      project: {
        connect: {
          id: projectId
        }
      },
      lastUpdatedBy: {
        connect: {
          id: user.id
        }
      }
    },
    include: InclusionQuery.Environment
  })

  logger.log(
    `Environment ${environment.name} (${environment.slug}) created in project ${project.name}`
  )

  // await projectCacheService.addEnvironmentToProjectCache(
  //   environment.project.slug,
  //   environment
  // )

  const hydratedEnvironment = await hydrationService.hydrateEnvironment({
    environment,
    user
  })
  delete hydratedEnvironment.project
  return hydratedEnvironment
}
