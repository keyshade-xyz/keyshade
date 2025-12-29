import {
  Authority,
  EventSource,
  EventType,
  ProjectAccessLevel,
  Workspace
} from '@prisma/client'
import { CreateWorkspace } from '@/workspace/dto/create.workspace/create.workspace'
import { PrismaService } from '@/prisma/prisma.service'
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common'
import { v4 } from 'uuid'
import { createEvent } from './event'
import SlugGenerator from './slug-generator.service'
import { HydratedWorkspace } from '@/workspace/workspace.types'
import { InclusionQuery } from './inclusion-query'
import { HydrationService } from './hydration.service'
import { AuthenticatedUser } from '@/user/user.types'
import { constructErrorBody } from './util'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'
import {
  createKeyPair,
  encrypt,
  generateRandomBytes
} from '@/common/cryptography'

/**
 * Creates a new workspace and adds the user as the owner.
 * @param user The user creating the workspace
 * @param dto The workspace data
 * @param prisma The Prisma client
 * @param slugGenerator
 * @param hydrationService
 * @param workspaceCacheService
 * @param isDefault Whether the workspace should be the default workspace
 * @returns The created workspace
 */
export const createWorkspace = async (
  user: AuthenticatedUser,
  dto: CreateWorkspace,
  prisma: PrismaService,
  slugGenerator: SlugGenerator,
  hydrationService: HydrationService,
  workspaceCacheService: WorkspaceCacheService,
  isDefault?: boolean
): Promise<HydratedWorkspace> => {
  const logger = new Logger('createWorkspace')

  const workspaceId = v4()
  const workspaceSlug = await slugGenerator.generateEntitySlug(
    dto.name,
    'WORKSPACE'
  )
  const workspaceAdminRoleSlug = await slugGenerator.generateEntitySlug(
    'Admin',
    'WORKSPACE_ROLE'
  )

  logger.log(
    `Creating workspace ${dto.name} (${workspaceSlug}) for user ${user.id} and admin role ${workspaceAdminRoleSlug}`
  )

  const ops = []

  // Create the workspace
  ops.push(
    prisma.workspace.create({
      data: {
        id: workspaceId,
        slug: workspaceSlug,
        name: dto.name,
        icon: dto.icon,
        ownerId: user.id,
        isDefault,
        roles: {
          createMany: {
            data: [
              {
                name: 'Admin',
                slug: workspaceAdminRoleSlug,
                authorities: [Authority.WORKSPACE_ADMIN],
                hasAdminAuthority: true,
                colorCode: '#FF0000'
              }
            ]
          }
        },
        subscription: {
          create: {
            userId: user.id
          }
        }
      },
      include: InclusionQuery.Workspace
    })
  )

  // Add the owner to the workspace
  ops.push(
    prisma.workspaceMember.create({
      data: {
        workspace: {
          connect: {
            id: workspaceId
          }
        },
        user: {
          connect: {
            id: user.id
          }
        },
        invitationAccepted: true,
        roles: {
          create: {
            role: {
              connect: {
                workspaceId_name: {
                  workspaceId: workspaceId,
                  name: 'Admin'
                }
              }
            }
          }
        }
      }
    })
  )

  if (isDefault) {
    // If this is a default workspace, we would like to do the following for our new user:
    // - Create a project named Example Project
    // - Create 3 environments: development, staging and production
    // - Create 2 secrets: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    // - Create 2 variables: AWS_BUCKET_NAME and PORT
    // - Create one revision for each of the secrets and variables across all the environments
    // - Additionally, create 2 extra revisions for AWS_SECRET_ACCESS_KEY and PORT

    const { publicKey, privateKey } = createKeyPair()

    const projectName = 'Example Project'
    const projectId = v4()
    const projectSlug = await slugGenerator.generateEntitySlug(
      projectName,
      'PROJECT'
    )

    const secret1Name = 'AWS_ACCESS_KEY_ID'
    const secret1Id = v4()
    const secret1Slug = await slugGenerator.generateEntitySlug(
      secret1Name,
      'SECRET'
    )
    const secret2Name = 'AWS_SECRET_ACCESS_KEY'
    const secret2Id = v4()
    const secret2Slug = await slugGenerator.generateEntitySlug(
      secret2Name,
      'SECRET'
    )

    const variable1Name = 'AWS_BUCKET_NAME'
    const variable1Id = v4()
    const variable1Slug = await slugGenerator.generateEntitySlug(
      variable1Name,
      'VARIABLE'
    )
    const variable2Name = 'PORT'
    const variable2Id = v4()
    const variable2Slug = await slugGenerator.generateEntitySlug(
      variable2Name,
      'VARIABLE'
    )

    const environment1Name = 'development'
    const environment1Id = v4()
    const environment1Slug = await slugGenerator.generateEntitySlug(
      environment1Name,
      'ENVIRONMENT'
    )
    const environment2Name = 'staging'
    const environment2Id = v4()
    const environment2Slug = await slugGenerator.generateEntitySlug(
      environment2Name,
      'ENVIRONMENT'
    )
    const environment3Name = 'production'
    const environment3Id = v4()
    const environment3Slug = await slugGenerator.generateEntitySlug(
      environment3Name,
      'ENVIRONMENT'
    )

    // Create the project
    ops.push(
      prisma.project.create({
        data: {
          id: projectId,
          name: projectName,
          slug: projectSlug,
          description:
            "This is an auto-generated project. Here's the private key for this project: " +
            privateKey,
          storePrivateKey: false,
          publicKey,
          accessLevel: ProjectAccessLevel.INTERNAL,
          workspaceId,
          lastUpdatedById: user.id
        }
      })
    )

    // Create the environments
    ops.push(
      prisma.environment.createMany({
        data: [
          {
            id: environment1Id,
            name: environment1Name,
            slug: environment1Slug,
            projectId,
            lastUpdatedById: user.id
          },
          {
            id: environment2Id,
            name: environment2Name,
            slug: environment2Slug,
            projectId,
            lastUpdatedById: user.id
          },
          {
            id: environment3Id,
            name: environment3Name,
            slug: environment3Slug,
            projectId,
            lastUpdatedById: user.id
          }
        ]
      })
    )

    // Create the secrets
    ops.push(
      prisma.secret.createMany({
        data: [
          {
            id: secret1Id,
            name: secret1Name,
            slug: secret1Slug,
            projectId,
            lastUpdatedById: user.id
          },
          {
            id: secret2Id,
            name: secret2Name,
            slug: secret2Slug,
            projectId,
            lastUpdatedById: user.id
          }
        ]
      })
    )

    // Create the secret versions
    ops.push(
      prisma.secretVersion.createMany({
        data: [
          {
            value: await encrypt(
              publicKey,
              generateRandomBytes(37).plaintext.toUpperCase()
            ),
            version: 1,
            environmentId: environment1Id,
            secretId: secret1Id,
            createdById: user.id
          },
          {
            value: await encrypt(
              publicKey,
              generateRandomBytes(37).plaintext.toUpperCase()
            ),
            version: 1,
            environmentId: environment2Id,
            secretId: secret1Id,
            createdById: user.id
          },
          {
            value: await encrypt(
              publicKey,
              `AKIA${generateRandomBytes(16).plaintext.toUpperCase()}`
            ),
            version: 1,
            environmentId: environment1Id,
            secretId: secret2Id,
            createdById: user.id
          },
          {
            value: await encrypt(
              publicKey,
              `AKIA${generateRandomBytes(16).plaintext.toUpperCase()}`
            ),
            version: 2,
            environmentId: environment1Id,
            secretId: secret2Id,
            createdById: user.id
          },
          {
            value: await encrypt(
              publicKey,
              `AKIA${generateRandomBytes(16).plaintext.toUpperCase()}`
            ),
            version: 3,
            environmentId: environment1Id,
            secretId: secret2Id,
            createdById: user.id
          },
          {
            value: await encrypt(
              publicKey,
              `AKIA${generateRandomBytes(16).plaintext.toUpperCase()}`
            ),
            version: 1,
            environmentId: environment2Id,
            secretId: secret2Id,
            createdById: user.id
          },
          {
            value: await encrypt(
              publicKey,
              `AKIA${generateRandomBytes(16).plaintext.toUpperCase()}`
            ),
            version: 1,
            environmentId: environment3Id,
            secretId: secret2Id,
            createdById: user.id
          }
        ]
      })
    )

    // Create the variables
    ops.push(
      prisma.variable.createMany({
        data: [
          {
            id: variable1Id,
            name: variable1Name,
            slug: variable1Slug,
            projectId,
            lastUpdatedById: user.id
          },
          {
            id: variable2Id,
            name: variable2Name,
            slug: variable2Slug,
            projectId,
            lastUpdatedById: user.id
          }
        ]
      })
    )

    // Create the variable versions
    ops.push(
      prisma.variableVersion.createMany({
        data: [
          {
            value: `example-bucket-${generateRandomBytes(6).plaintext.toLowerCase()}`,
            environmentId: environment1Id,
            version: 1,
            variableId: variable1Id,
            createdById: user.id
          },
          {
            value: `example-bucket-${generateRandomBytes(6).plaintext.toLowerCase()}`,
            environmentId: environment2Id,
            version: 1,
            variableId: variable1Id,
            createdById: user.id
          },
          {
            value: '3000',
            environmentId: environment1Id,
            version: 1,
            variableId: variable2Id,
            createdById: user.id
          },
          {
            value: '4000',
            environmentId: environment1Id,
            version: 2,
            variableId: variable2Id,
            createdById: user.id
          },
          {
            value: '5000',
            environmentId: environment1Id,
            version: 3,
            variableId: variable2Id,
            createdById: user.id
          },
          {
            value: '3000',
            environmentId: environment2Id,
            version: 1,
            variableId: variable2Id,
            createdById: user.id
          },
          {
            value: '3000',
            environmentId: environment3Id,
            version: 1,
            variableId: variable2Id,
            createdById: user.id
          }
        ]
      })
    )
  }

  logger.log(
    `Executing transactions for creating workspace ${dto.name} (${workspaceSlug}) and assigning ownership ${workspaceAdminRoleSlug} to user ${user.id}`
  )
  const result = await prisma.$transaction(ops)
  logger.log(
    `Assigned ownership of workspace ${dto.name} (${workspaceId}) to user ${user.id}`
  )
  logger.log(
    `Created workspace ${dto.name} (${workspaceSlug}) for user ${user.id}`
  )
  logger.log(
    `Executed transactions for creating workspace and assigning ownership`
  )

  const workspace = result[0]
  await workspaceCacheService.setRawWorkspace(workspace)

  await createEvent(
    {
      triggeredBy: user,
      entity: workspace,
      type: EventType.WORKSPACE_CREATED,
      source: EventSource.WORKSPACE,
      title: `Workspace created`,
      metadata: {
        workspaceId: workspace.id,
        name: workspace.name
      },
      workspaceId: workspace.id
    },
    prisma
  )

  return await hydrationService.hydrateWorkspace({
    user,
    workspace
  })
}

/**
 * Checks if a workspace is disabled.
 *
 * @param workspaceId - The ID of the workspace to check.
 * @param prisma - The Prisma service used to access the database.
 * @param logMessage - Optional custom log message to use if the workspace is disabled.
 * @throws NotFoundException if the workspace is not found.
 * @throws BadRequestException if the workspace is disabled.
 */
export async function checkForDisabledWorkspace(
  workspaceId: Workspace['id'],
  prisma: PrismaService,
  logMessage?: string
) {
  const logger = new Logger('checkForDisabledWorkspace')

  logger.log(`Fetching workspace ${workspaceId} to check if it is disabled`)
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId
    }
  })

  if (!workspace) {
    throw new NotFoundException(
      constructErrorBody(
        'Workspace not found',
        'The specified workspace was not found'
      )
    )
  }

  if (workspace.isDisabled) {
    logger.log(
      logMessage ||
        `Attempted to perform a forbidden operation on a disabled workspace ${workspaceId}`
    )
    throw new BadRequestException(
      constructErrorBody(
        'This workspace has been disabled',
        'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
      )
    )
  }
}
