import { PrismaService } from '@/prisma/prisma.service'
import { CreateSecret } from '@/secret/dto/create.secret/create.secret'
import { UpdateSecret } from '@/secret/dto/update.secret/update.secret'
import { CreateVariable } from '@/variable/dto/create.variable/create.variable'
import { UpdateVariable } from '@/variable/dto/update.variable/update.variable'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Authority, Project, User } from '@prisma/client'
import { AuthorityCheckerService } from './authority-checker.service'
import { constructErrorBody } from './util'

/**
 * Given a list of environment slugs in a CreateSecret, UpdateSecret, CreateVariable, or UpdateVariable DTO,
 * this function checks if the user has access to all the environments and if the environments belong to the given project.
 * If all the checks pass, it returns a Map of environment slug to environment ID.
 *
 * @param dto The DTO containing the list of environment slugs
 * @param user The user making the request
 * @param project The project that the environments must belong to
 * @param prisma The PrismaService instance
 * @param authorityCheckerService The AuthorityCheckerService instance
 *
 * @throws NotFoundException if any of the environments do not exist
 * @throws BadRequestException if any of the environments do not belong to the given project
 *
 * @returns A Map of environment slug to environment ID
 */
export const getEnvironmentIdToSlugMap = async (
  dto: CreateSecret | UpdateSecret | CreateVariable | UpdateVariable,
  user: User,
  project: Project,
  prisma: PrismaService,
  authorityCheckerService: AuthorityCheckerService
): Promise<Map<string, string>> => {
  const environmentSlugToIdMap = new Map<string, string>()

  // Check if the user has access to the environments
  const environmentSlugs = dto.entries.map((entry) => entry.environmentSlug)
  await Promise.all(
    environmentSlugs.map(async (environmentSlug) => {
      const environment =
        await authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { slug: environmentSlug },
          authorities: [Authority.READ_ENVIRONMENT],
          prisma: prisma
        })

      if (!environment) {
        throw new NotFoundException(
          constructErrorBody(
            'Environment not found',
            `Environment ${environmentSlug} not found`
          )
        )
      }

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
