import { CreateSecret } from '@/secret/dto/create.secret/create.secret'
import { UpdateSecret } from '@/secret/dto/update.secret/update.secret'
import { CreateVariable } from '@/variable/dto/create.variable/create.variable'
import { UpdateVariable } from '@/variable/dto/update.variable/update.variable'
import { BadRequestException } from '@nestjs/common'
import { Authority, Project } from '@prisma/client'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthenticatedUser } from '@/user/user.types'
import { constructErrorBody } from './util'

/**
 * Given a list of environment slugs in a CreateSecret, UpdateSecret, CreateVariable, or UpdateVariable DTO,
 * this function checks if the user has access to all the environments and if the environments belong to the given project.
 * If all the checks pass, it returns a Map of environment slug to environment ID.
 *
 * @param dto The DTO containing the list of environment slugs
 * @param user The user making the request
 * @param project The project that the environments must belong to
 * @param authorityCheckerService The AuthorityCheckerService instance
 * @param shouldCreateRevisions If not set, the function will return an empty Map
 *
 * @throws NotFoundException if any of the environments do not exist
 * @throws BadRequestException if any of the environments do not belong to the given project
 *
 * @returns A Map of environment slug to environment ID
 */
export const getEnvironmentIdToSlugMap = async (
  dto: CreateSecret | UpdateSecret | CreateVariable | UpdateVariable,
  user: AuthenticatedUser,
  project: Partial<Project>,
  authorizationService: AuthorizationService,
  shouldCreateRevisions: boolean
): Promise<Map<string, string>> => {
  const environmentSlugToIdMap = new Map<string, string>()

  if (!shouldCreateRevisions) return environmentSlugToIdMap

  // Check if the user has access to the environments
  const environmentSlugs = dto.entries.map((entry) => entry.environmentSlug)
  await Promise.all(
    environmentSlugs.map(async (environmentSlug) => {
      const environment =
        await authorizationService.authorizeUserAccessToEnvironment({
          user,
          entity: { slug: environmentSlug },
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
    })
  )

  return environmentSlugToIdMap
}
