import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { decrypt } from '@/common/cryptography'
import { limitMaxItemsPerPage } from '@/common/util'
import { PrismaService } from '@/prisma/prisma.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import {
  Authority,
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'

export interface getSecretsOfProjectHelperInput {
  user: User
  projectSlug: Project['slug']
  decryptValue: boolean
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
 * Gets all secrets of a project
 * @param user the user performing the action
 * @param projectSlug the slug of the project
 * @param decryptValue whether to decrypt the secret values or not
 * @param prisma Prisma service to query DB
 * @param authorityCheckerService authority check service to check if user has required authority
 * @param skipPagination Boolean to see if pagnation is required or not
 * @param page the page of items to return
 * @param limit the number of items to return per page
 * @param sort the field to sort the results by
 * @param order the order of the results
 * @param search the search query
 * @returns an object with the items and the total count according to search query provided
 */
export const getSecretsOfProjectHelper = async (
  input: getSecretsOfProjectHelperInput
) => {
  const {
    user,
    projectSlug,
    decryptValue,
    prisma,
    authorityCheckerService,
    skipPagination = false,
    page = 0,
    limit = 10,
    sort = 'name',
    order = 'asc',
    search = ''
  } = input

  // Fetch the project
  const project = await authorityCheckerService.checkAuthorityOverProject({
    userId: user.id,
    entity: { slug: projectSlug },
    authorities: [Authority.READ_SECRET],
    prisma
  })
  const projectId = project.id

  // Check if the secret values can be decrypted
  await checkAutoDecrypt(decryptValue, project)

  const secrets = await prisma.secret.findMany({
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

  const secretsWithEnvironmentalValues = new Map<
    Secret['id'],
    {
      secret: Secret
      values: {
        environment: {
          name: Environment['name']
          id: Environment['id']
        }
        value: SecretVersion['value']
        version: SecretVersion['version']
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

  for (const secret of secrets) {
    // Make a copy of the environment IDs
    const envIds = new Map(environmentIds)
    let iterations = envIds.size

    // Find the latest version for each environment
    while (iterations--) {
      const latestVersion = await prisma.secretVersion.findFirst({
        where: {
          secretId: secret.id,
          environmentId: {
            in: Array.from(envIds.keys())
          }
        },
        orderBy: {
          version: 'desc'
        }
      })

      if (!latestVersion) continue

      if (secretsWithEnvironmentalValues.has(secret.id)) {
        secretsWithEnvironmentalValues.get(secret.id).values.push({
          environment: {
            id: latestVersion.environmentId,
            name: envIds.get(latestVersion.environmentId)
          },
          value: decryptValue
            ? await decrypt(project.privateKey, latestVersion.value)
            : latestVersion.value,
          version: latestVersion.version
        })
      } else {
        secretsWithEnvironmentalValues.set(secret.id, {
          secret,
          values: [
            {
              environment: {
                id: latestVersion.environmentId,
                name: envIds.get(latestVersion.environmentId)
              },
              value: decryptValue
                ? await decrypt(project.privateKey, latestVersion.value)
                : latestVersion.value,
              version: latestVersion.version
            }
          ]
        })
      }

      envIds.delete(latestVersion.environmentId)
    }
  }

  const items = Array.from(secretsWithEnvironmentalValues.values())

  // Calculate pagination metadata
  const totalCount = await prisma.secret.count({
    where: {
      projectId,
      name: {
        contains: search
      }
    }
  })

  return { items, totalCount }
}

/**
 * Checks if the project is allowed to decrypt secret values
 * @param decryptValue whether to decrypt the secret values or not
 * @param project the project to check
 * @throws {BadRequestException} if the project does not store the private key and decryptValue is true
 * @throws {NotFoundException} if the project does not have a private key and decryptValue is true
 */
export const checkAutoDecrypt = async (
  decryptValue: boolean,
  project: Project
) => {
  // Check if the project is allowed to store the private key
  if (decryptValue && !project.storePrivateKey) {
    throw new BadRequestException(
      `Cannot decrypt secret values as the project does not store the private key`
    )
  }

  // Check if the project has a private key. This is just to ensure that we don't run into any
  // problems while decrypting the secret
  if (decryptValue && !project.privateKey) {
    throw new NotFoundException(
      `Cannot decrypt secret values as the project does not have a private key`
    )
  }
}
