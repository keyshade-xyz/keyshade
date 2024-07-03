import { Authority, Environment, Project, User, Variable, VariableVersion } from "@prisma/client"
import { PrismaService } from "src/prisma/prisma.service"
import { AuthorityCheckerService } from "./authority-checker.service"

export default async function getAllVariablesOfProject(
  prisma: PrismaService,
  authorityCheckerService: AuthorityCheckerService,
  user: User,
  projectId: Project['id'],
  page: number,
  limit: number,
  sort: string,
  order: string,
  search: string
) {
  // Check if the user has the required authorities in the project
  await authorityCheckerService.checkAuthorityOverProject({
    userId: user.id,
    entity: { id: projectId },
    authority: Authority.READ_VARIABLE,
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
    skip: page * limit,
    take: limit,
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
  const environmentIds = new Map(
    environments.map((env) => [env.id, env.name])
  )

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

  return Array.from(variablesWithEnvironmentalValues.values())
}