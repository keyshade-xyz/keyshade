import { User, Project, Authority, Secret, Environment, SecretVersion } from "@prisma/client"
import { PrismaService } from "src/prisma/prisma.service"
import { AuthorityCheckerService } from "./authority-checker.service"
import { decrypt } from "./decrypt"
import { BadRequestException, NotFoundException } from "@nestjs/common"

async function checkAutoDecrypt(decryptValue: boolean, project: Project) {
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

export default async function getAllSecretsOfProject(
  prisma: PrismaService,
  authorityCheckerService: AuthorityCheckerService,
  user: User,
  projectId: Project['id'],
  decryptValue: boolean,
  page: number,
  limit: number,
  sort: string,
  order: string,
  search: string
) {
  // Fetch the project
  const project =
    await authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: projectId },
      authority: Authority.READ_SECRET,
      prisma: prisma
    })

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
    skip: page * limit,
    take: limit,
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
  const environmentIds = new Map(
    environments.map((env) => [env.id, env.name])
  )

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

  return Array.from(secretsWithEnvironmentalValues.values())
}

