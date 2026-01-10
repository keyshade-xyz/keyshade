import { BadRequestException } from '@nestjs/common'
import { Authority, Environment, Project } from '@prisma/client'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthenticatedUser } from '@/user/user.types'
import { constructErrorBody } from './util'

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
