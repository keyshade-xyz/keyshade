import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { limitMaxItemsPerPage } from '@/common/util'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Authority,
  Environment,
  Project,
  User,
  Variable,
  VariableVersion
} from '@prisma/client'

export interface getVariablesOfProjectHelperInput {
  user: User
  projectSlug: Project['slug']
  prisma: PrismaService
  authorityCheckerService: AuthorityCheckerService
  skipPagination?: boolean
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

/**
 * Gets all variables of a project, paginated, sorted and filtered by search query.
 * @param user the user performing the action
 * @param projectSlug the slug of the project to get the variables from
 * @param prisma Prisma service to query DB
 * @param authorityCheckerService authority check service to check if user has required authority
 * @param skipPagination Boolean to see if pagnation is required or not
 * @param page the page number to fetch
 * @param limit the number of items per page
 * @param sort the field to sort by
 * @param order the order to sort in
 * @param search the search query to filter by
 * @returns a paginated list of variables with their latest versions for each environment and total count according to search term provided
 * @throws `NotFoundException` if the project does not exist
 * @throws `ForbiddenException` if the user does not have the required authority
 */
export const getVariablesOfProjectHelper = async (
  input: getVariablesOfProjectHelperInput
) => {
  const {
    user,
    projectSlug,
    prisma,
    authorityCheckerService,
    skipPagination = false,
    page = 0,
    limit = 10,
    sort = 'name',
    order = 'asc',
    search = ''
  } = input
  // Check if the user has the required authorities in the project
  const { id: projectId } =
    await authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { slug: projectSlug },
      authorities: [Authority.READ_VARIABLE],
      prisma: prisma
    })

  const variables = await prisma.variable.findMany({
    where: {
      projectId,
      name: {
        contains: search
      }
    },
    include: {
      lastUpdatedBy: {
        select: {
          id: true,
          name: true
        }
      }
    },
    ...(skipPagination
      ? {}
      : { skip: page * limit, take: limitMaxItemsPerPage(limit) }),
    orderBy: {
      [sort]: order
    }
  })

  const variablesWithEnvironmentalValues = new Map<
    Variable['id'],
    {
      variable: Variable
      values: {
        environment: {
          name: Environment['name']
          id: Environment['id']
        }
        value: VariableVersion['value']
        version: VariableVersion['version']
      }[]
    }
  >()

  // Find all the environments for this project
  const environments = await prisma.environment.findMany({
    where: {
      projectId
    }
  })
  const environmentIds = new Map(environments.map((env) => [env.id, env.name]))

  for (const variable of variables) {
    // Make a copy of the environment IDs
    const envIds = new Map(environmentIds)
    let iterations = envIds.size

    // Find the latest version for each environment
    while (iterations--) {
      const latestVersion = await prisma.variableVersion.findFirst({
        where: {
          variableId: variable.id,
          environmentId: {
            in: Array.from(envIds.keys())
          }
        },
        orderBy: {
          version: 'desc'
        }
      })

      if (!latestVersion) continue

      if (variablesWithEnvironmentalValues.has(variable.id)) {
        variablesWithEnvironmentalValues.get(variable.id).values.push({
          environment: {
            id: latestVersion.environmentId,
            name: envIds.get(latestVersion.environmentId)
          },
          value: latestVersion.value,
          version: latestVersion.version
        })
      } else {
        variablesWithEnvironmentalValues.set(variable.id, {
          variable,
          values: [
            {
              environment: {
                id: latestVersion.environmentId,
                name: envIds.get(latestVersion.environmentId)
              },
              value: latestVersion.value,
              version: latestVersion.version
            }
          ]
        })
      }

      envIds.delete(latestVersion.environmentId)
    }
  }

  const items = Array.from(variablesWithEnvironmentalValues.values())

  //calculate metadata
  const totalCount = await prisma.variable.count({
    where: {
      projectId,
      name: {
        contains: search
      }
    }
  })

  return { items, totalCount }
}
