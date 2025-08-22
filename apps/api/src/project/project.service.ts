import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger
} from '@nestjs/common'
import {
  Authority,
  Environment,
  EventSource,
  EventType,
  Project,
  ProjectAccessLevel,
  Secret,
  SecretVersion,
  Variable,
  Workspace
} from '@prisma/client'
import { CreateProject } from './dto/create.project/create.project'
import { UpdateProject } from './dto/update.project/update.project'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { v4 } from 'uuid'
import { ExportFormat, HydratedProject } from './project.types'
import { ForkProject } from './dto/fork.project/fork.project'
import { paginate, PaginatedResponse } from '@/common/paginate'
import {
  createKeyPair,
  decrypt,
  encrypt,
  sDecrypt,
  sEncrypt
} from '@/common/cryptography'
import { createEvent } from '@/common/event'
import {
  constructErrorBody,
  excludeFields,
  limitMaxItemsPerPage
} from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'
import SlugGenerator from '@/common/slug-generator.service'
import { SecretService } from '@/secret/secret.service'
import { VariableService } from '@/variable/variable.service'
import { ExportService } from './export/export.service'
import { InclusionQuery } from '@/common/inclusion-query'
import { HydrationService } from '@/common/hydration.service'
import { checkForDisabledWorkspace } from '@/common/workspace'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'

@Injectable()
export class ProjectService {
  private readonly logger: Logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly tierLimitService: TierLimitService,
    private readonly slugGenerator: SlugGenerator,
    private readonly secretService: SecretService,
    private readonly variableService: VariableService,
    private readonly exportService: ExportService,
    private readonly hydrationService: HydrationService
  ) {}

  /**
   * Creates a new project in a workspace
   *
   * @param user The user who is creating the project
   * @param workspaceSlug The slug of the workspace where the project will be created
   * @param dto The data for the new project
   * @returns The newly created project
   */
  async createProject(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    dto: CreateProject
  ): Promise<HydratedProject> {
    this.logger.log(`User ${user.id} attempted to create a project ${dto.name}`)

    // Check if the workspace exists or not
    this.logger.log(`Checking if workspace ${workspaceSlug} exists`)
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        slug: workspaceSlug,
        authorities: [Authority.CREATE_PROJECT]
      })
    const workspaceId = workspace.id

    if (workspace.isDisabled) {
      this.logger.log(
        `User ${user.id} attempted to create a project in disabled workspace ${workspaceSlug}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'This workspace has been disabled',
          'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
        )
      )
    }

    // Check if more workspaces can be created under the workspace
    await this.tierLimitService.checkProjectLimitReached(workspace)

    // Check if project with this name already exists for the user
    await this.projectExists(dto.name, workspaceId)

    // Create the public and private key pair
    this.logger.log(`Creating key pair for project ${dto.name}`)
    const { publicKey, privateKey } = createKeyPair()

    const data: any = {
      name: dto.name,
      slug: await this.slugGenerator.generateEntitySlug(dto.name, 'PROJECT'),
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
      this.logger.log(`Storing private key for project ${dto.name}`)
      data.privateKey = sEncrypt(privateKey)
    } else {
      this.logger.log(`Not storing private key for project ${dto.name}`)
    }

    const userId = user.id

    const newProjectId = v4()

    // Create and return the project
    this.logger.log(
      `Creating project ${dto.name} under workspace ${workspace.slug}`
    )
    const createNewProject = this.prisma.project.create({
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

    // Create and assign the environments provided in the request, if any
    // or create a default environment
    if (dto.environments && dto.environments.length > 0) {
      this.logger.log(
        `Project has ${dto.environments.length} environments to create`
      )
      for (const environment of dto.environments) {
        const environmentSlug = await this.slugGenerator.generateEntitySlug(
          environment.name,
          'ENVIRONMENT'
        )
        newEnvironmentSlugs.push(environmentSlug)
        createEnvironmentOps.push(
          this.prisma.environment.create({
            data: {
              name: environment.name,
              slug: environmentSlug,
              description: environment.description,
              projectId: newProjectId,
              lastUpdatedById: user.id
            }
          })
        )
      }
    } else {
      this.logger.log(`Creating default environment for project ${dto.name}`)
      const environmentSlug = await this.slugGenerator.generateEntitySlug(
        'default',
        'ENVIRONMENT'
      )
      newEnvironmentSlugs.push(environmentSlug)
      createEnvironmentOps.push(
        this.prisma.environment.create({
          data: {
            name: 'default',
            slug: await this.slugGenerator.generateEntitySlug(
              'default',
              'ENVIRONMENT'
            ),
            description: 'Default environment for the project',
            projectId: newProjectId,
            lastUpdatedById: user.id
          }
        })
      )
    }

    const [newProject] = await this.prisma.$transaction([
      createNewProject,
      ...createEnvironmentOps
    ])

    await createEvent(
      {
        triggeredBy: user,
        entity: newProject,
        type: EventType.PROJECT_CREATED,
        source: EventSource.PROJECT,
        title: `Project created`,
        metadata: {
          projectId: newProject.id,
          name: newProject.name,
          workspaceId,
          workspaceName: workspace.name
        },
        workspaceId
      },
      this.prisma
    )

    this.logger.debug(`Created project ${newProject.name} (${newProject.slug})`)

    // It is important that we log before the private key is set
    // in order to not log the private key
    newProject.privateKey = privateKey

    await this.workspaceCacheService.addProjectToRawWorkspace(
      workspace,
      newProject
    )

    return await this.hydrationService.hydrateProject({
      project: newProject,
      user,
      authorizationService: this.authorizationService
    })
  }

  /**
   * Updates a project.
   *
   * @param user The user who is updating the project
   * @param projectSlug The slug of the project to update
   * @param dto The data to update the project with
   * @returns The updated project
   *
   * @throws ConflictException If a project with the same name already exists for the user
   * @throws BadRequestException If the private key is required but not supplied
   */
  async updateProject(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    dto: UpdateProject
  ): Promise<HydratedProject> {
    this.logger.log(
      `User ${user.id} attempted to update project ${projectSlug}`
    )

    // Check if the user has the authority to update the project
    let authority: Authority = Authority.UPDATE_PROJECT

    // Only admins can change the visibility of the project
    if (dto.accessLevel) authority = Authority.WORKSPACE_ADMIN

    this.logger.log(`Checking if user has authority to update project`)
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [authority]
      })

    // Check if project with this name already exists for the user
    dto.name && (await this.projectExists(dto.name, project.workspaceId))

    // Check if the private key is to be stored but, either the project
    // already stores the key, or the key to be stored is not specified
    if (dto.storePrivateKey) {
      if (project.storePrivateKey === true && project.privateKey) {
        this.logger.log(
          `Project ${project.slug} already stores the private key`
        )
        throw new BadRequestException(
          constructErrorBody(
            'Private key already stored',
            'The project already stores the private key'
          )
        )
      } else if (!dto.privateKey) {
        this.logger.log(
          `Private key to store not specified while updating project ${project.slug}`
        )
        throw new BadRequestException(
          constructErrorBody(
            'Private key missing',
            'You did not specify the private key to store'
          )
        )
      }
    }

    if (!dto.storePrivateKey && !dto.regenerateKeyPair) {
      // Explicitly set dto.privateKey to null to avoid db issues
      dto.privateKey = null
    }

    if (dto.accessLevel) {
      this.logger.log(`Access level specified while updating project.`)
      const currentAccessLevel = project.accessLevel

      if (
        currentAccessLevel !== ProjectAccessLevel.GLOBAL &&
        dto.accessLevel === ProjectAccessLevel.GLOBAL
      ) {
        this.logger.log(`Project is being set as GLOBAL`)

        // If the project is being made global, the private key must be stored
        // This is because we want anyone to see the secrets in the project
        dto.storePrivateKey = true
        dto.privateKey =
          dto.privateKey || project.privateKey
            ? sDecrypt(project.privateKey)
            : null

        // We can't make the project global if a private key isn't supplied,
        // because we need to decrypt the secrets
        if (!dto.privateKey) {
          this.logger.error(
            `Private key not provided while setting project as GLOBAL for project ${project.slug}`
          )
          throw new BadRequestException(
            constructErrorBody(
              'Private key required',
              'Please provide the private key if you wish to set the project as GLOBAL'
            )
          )
        }
      } else if (
        currentAccessLevel === ProjectAccessLevel.GLOBAL &&
        dto.accessLevel !== ProjectAccessLevel.GLOBAL
      ) {
        this.logger.log(`Project is being set as PRIVATE or INTERNAL`)

        dto.storePrivateKey = false
        dto.regenerateKeyPair = true

        // At this point, we already will have the private key since the project is global
        dto.privateKey = sDecrypt(project.privateKey)
      }
    } else {
      this.logger.log(`Access level not specified while updating project.`)
    }

    const data: Partial<Project> = {
      name: dto.name === project.name ? undefined : dto.name,
      slug:
        dto.name && dto.name !== project.name
          ? await this.slugGenerator.generateEntitySlug(dto.name, 'PROJECT')
          : project.slug,
      description: dto.description,
      storePrivateKey: dto.storePrivateKey,
      privateKey: dto.storePrivateKey ? dto.privateKey : null,
      accessLevel: dto.accessLevel
    }

    // If the access level is changed to PRIVATE or internal, we would
    // also need to unlink all the forks
    if (
      dto.accessLevel !== ProjectAccessLevel.GLOBAL &&
      project.accessLevel === ProjectAccessLevel.GLOBAL
    ) {
      this.logger.log(`Set to unlink forks of ${project.slug}`)
      data.isForked = false
      data.forkedFromId = null
    }

    const versionUpdateOps = []
    let privateKey = dto.privateKey
    let publicKey = project.publicKey

    if (dto.regenerateKeyPair) {
      this.logger.log(`Set to regenerate key pair for project ${project.slug}`)
      if (dto.privateKey || project.privateKey) {
        const { txs, newPrivateKey, newPublicKey } =
          await this.updateProjectKeyPair(
            project.id,
            dto.privateKey || sDecrypt(project.privateKey),
            project.storePrivateKey || dto.storePrivateKey
          )

        privateKey = newPrivateKey
        publicKey = newPublicKey

        versionUpdateOps.push(...txs)
      } else {
        this.logger.error(
          `Private key not provided while regenerating key pair for project ${project.slug}`
        )
        throw new BadRequestException(
          constructErrorBody(
            'Private key required',
            'Please provide the private key if you wish to regenerate the key pair'
          )
        )
      }
    }

    // Update and return the project
    const updateProjectOp = this.prisma.project.update({
      where: {
        id: project.id
      },
      data: {
        ...data,
        lastUpdatedById: user.id
      },
      include: InclusionQuery.Project
    })

    const [updatedProject] = await this.prisma.$transaction([
      updateProjectOp,
      ...versionUpdateOps
    ])

    await createEvent(
      {
        triggeredBy: user,
        entity: updatedProject,
        type: EventType.PROJECT_UPDATED,
        source: EventSource.PROJECT,
        title: `Project updated`,
        metadata: {
          projectId: updatedProject.id,
          name: updatedProject.name
        },
        workspaceId: updatedProject.workspaceId
      },
      this.prisma
    )

    this.logger.debug(`Updated project ${updatedProject.slug}`)

    updatedProject.privateKey = privateKey
    updatedProject.publicKey = publicKey

    return await this.hydrationService.hydrateProject({
      project: updatedProject,
      user,
      authorizationService: this.authorizationService
    })
  }

  /**
   * Forks a project.
   *
   * @param user The user who is creating the new project
   * @param projectSlug The slug of the project to fork
   * @param forkMetadata The metadata for the new project
   * @returns The newly forked project
   *
   * @throws ConflictException If a project with the same name already exists for the user
   * @throws BadRequestException If the private key is required but not supplied
   */
  async forkProject(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    forkMetadata: ForkProject
  ): Promise<HydratedProject> {
    this.logger.log(`User ${user.id} attempted to fork project ${projectSlug}`)

    // Check if the user has the authority to read the project
    this.logger.log(
      `Checking if user has authority to read project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.READ_PROJECT]
      })

    await checkForDisabledWorkspace(
      project.workspaceId,
      this.prisma,
      `User ${user.id} attempted to fork project ${projectSlug} in disabled workspace ${project.workspaceId}`
    )

    let workspace: Workspace

    if (forkMetadata.workspaceSlug) {
      this.logger.log(
        `Project to be forked inside workspace ${forkMetadata.workspaceSlug}. Checking for authority`
      )
      workspace =
        await this.authorizationService.authorizeUserAccessToWorkspace({
          user,
          slug: forkMetadata.workspaceSlug,
          authorities: [Authority.CREATE_PROJECT]
        })

      if (workspace.isDisabled) {
        this.logger.log(
          `User ${user.id} attempted to fork project ${projectSlug} in disabled workspace`
        )
        throw new BadRequestException(
          constructErrorBody(
            'This workspace has been disabled',
            'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
          )
        )
      }
    } else {
      this.logger.log(
        `Project to be forked in default workspace. Fetching default workspace`
      )
      workspace = await this.prisma.workspace.findFirst({
        where: {
          ownerId: user.id,
          isDefault: true
        }
      })
    }

    const workspaceId = workspace.id
    const newProjectName = forkMetadata.name || project.name
    this.logger.log(`Forking project ${projectSlug} as ${newProjectName}`)

    // Check if project with this name already exists for the user
    await this.projectExists(newProjectName, workspaceId)

    this.logger.log(`Creating key pair for project ${newProjectName}`)
    const { privateKey, publicKey } = createKeyPair()
    const userId = user.id
    const newProjectId = v4()

    this.logger.log(`Fetching admin role for workspace ${workspaceId}`)
    const adminRole = await this.prisma.workspaceRole.findFirst({
      where: {
        workspaceId,
        hasAdminAuthority: true
      }
    })

    // Create and return the project
    const createNewProject = this.prisma.project.create({
      data: {
        id: newProjectId,
        name: newProjectName,
        slug: await this.slugGenerator.generateEntitySlug(
          newProjectName,
          'PROJECT'
        ),
        description: project.description,
        storePrivateKey:
          forkMetadata.storePrivateKey || project.storePrivateKey,
        publicKey: publicKey,
        privateKey:
          forkMetadata.storePrivateKey || project.storePrivateKey
            ? sEncrypt(privateKey)
            : null,
        accessLevel: project.accessLevel,
        isForked: true,
        forkedFromId: project.id,
        workspaceId,
        lastUpdatedById: userId
      },
      include: InclusionQuery.Project
    })

    const addProjectToAdminRoleOfItsWorkspace =
      this.prisma.workspaceRole.update({
        where: {
          id: adminRole.id
        },
        data: {
          projects: {
            create: {
              project: {
                connect: {
                  id: newProjectId
                }
              }
            }
          }
        }
      })

    const copyProjectOp = await this.copyProjectData(
      user,
      {
        id: project.id,
        privateKey: sDecrypt(project.privateKey)
      },
      {
        id: newProjectId,
        publicKey
      },
      true
    )

    const [newProject] = await this.prisma.$transaction([
      createNewProject,
      addProjectToAdminRoleOfItsWorkspace,
      ...copyProjectOp
    ])

    await createEvent(
      {
        triggeredBy: user,
        entity: newProject,
        type: EventType.PROJECT_CREATED,
        source: EventSource.PROJECT,
        title: `Project created`,
        metadata: {
          projectId: newProject.id,
          name: newProject.name,
          workspaceId,
          workspaceName: workspaceId
        },
        workspaceId
      },
      this.prisma
    )

    this.logger.debug(`Forked project ${newProject} (${newProject.slug})`)

    await this.workspaceCacheService.addProjectToRawWorkspace(
      workspace,
      newProject
    )

    return await this.hydrationService.hydrateProject({
      user,
      project: newProject,
      authorizationService: this.authorizationService
    })
  }

  /**
   * Unlinks a forked project from its parent project.
   *
   * @param user The user who is unlinking the project
   * @param projectSlug The slug of the project to unlink
   * @returns The updated project
   *
   * @throws BadRequestException If the project is not a forked project
   * @throws UnauthorizedException If the user does not have the authority to update the project
   */
  async unlinkParentOfFork(
    user: AuthenticatedUser,
    projectSlug: Project['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to unlink project ${projectSlug}`
    )

    this.logger.log(
      `Checking if user has authority to unlink project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.UPDATE_PROJECT]
      })
    const projectId = project.id

    this.isProjectForked(project)

    this.logger.log(`Unlinking project ${projectSlug} from its parent`)
    await this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        isForked: false,
        forkedFromId: null
      }
    })
    this.logger.debug(`Unlinked project ${projectSlug} from its parent`)
  }

  /**
   * Syncs a forked project with its parent project.
   *
   * @param user The user who is syncing the project
   * @param projectSlug The slug of the project to sync
   * @param hardSync Whether to do a hard sync or not. If true, all items in the
   * forked project will be replaced with the items from the parent project. If
   * false, only items that are not present in the forked project will be added
   * from the parent project.
   *
   * @throws BadRequestException If the project is not a forked project
   * @throws UnauthorizedException If the user does not have the authority to update the project
   */
  async syncFork(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    hardSync: boolean
  ) {
    this.logger.log(`User ${user.id} attempted to sync project ${projectSlug}`)

    this.logger.log(
      `Checking if user has authority to sync project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.UPDATE_PROJECT]
      })
    const projectId = project.id

    await checkForDisabledWorkspace(
      project.workspaceId,
      this.prisma,
      `User ${user.id} attempted to sync project ${projectSlug} in a disabled workspace ${project.workspaceId}`
    )

    this.isProjectForked(project)

    this.logger.log(`Fetching project that ${projectSlug} is forked from`)
    const forkedFromProject = await this.prisma.project.findUnique({
      where: {
        id: project.forkedFromId
      }
    })
    this.logger.log(
      `Project ${projectSlug} is forked from ${forkedFromProject}`
    )

    // Checking authority over the parent project
    this.logger.log(
      `Checking if user has authority to sync parent project ${forkedFromProject.slug}`
    )
    const parentProject =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: forkedFromProject.slug,
        authorities: [Authority.READ_PROJECT]
      })

    this.logger.log(`Syncing project ${projectSlug} with its parent`)
    const copyProjectOp = await this.copyProjectData(
      user,
      {
        id: parentProject.id,
        privateKey: sDecrypt(parentProject.privateKey)
      },
      {
        id: projectId,
        publicKey: project.publicKey
      },
      hardSync
    )

    await this.prisma.$transaction(copyProjectOp)
    this.logger.debug(`Synced project ${projectSlug} with its parent`)
  }

  /**
   * Deletes a project.
   * @param user The user who is deleting the project
   * @param projectSlug The slug of the project to delete
   *
   * @throws UnauthorizedException If the user does not have the authority to delete the project
   */
  async deleteProject(user: AuthenticatedUser, projectSlug: Project['slug']) {
    this.logger.log(
      `User ${user.id} attempted to delete project ${projectSlug}`
    )

    this.logger.log(
      `Checking if user has authority to delete project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.DELETE_PROJECT]
      })

    const op = []

    // Remove the fork relationships
    op.push(
      this.prisma.project.updateMany({
        where: {
          forkedFromId: project.id
        },
        data: {
          isForked: false,
          forkedFromId: null
        }
      })
    )

    // Delete the project
    op.push(
      this.prisma.project.delete({
        where: {
          id: project.id
        }
      })
    )

    await this.prisma.$transaction(op)

    await createEvent(
      {
        triggeredBy: user,
        type: EventType.PROJECT_DELETED,
        source: EventSource.PROJECT,
        entity: project,
        title: `Project deleted`,
        metadata: {
          projectId: project.id,
          name: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: project.workspaceId
      }
    })
    await this.workspaceCacheService.removeProjectFromRawWorkspace(
      workspace,
      project.id
    )
    this.logger.debug(`Deleted project ${project.slug}`)
  }

  /**
   * Gets all the forks of a project.
   *
   * @param user The user who is requesting the forks
   * @param projectSlug The slug of the project to get forks for
   * @param page The page number to get the forks for
   * @param limit The number of forks to get per page
   * @returns An object with two properties: `items` and `metadata`.
   * `items` is an array of project objects that are forks of the given project,
   * and `metadata` is the pagination metadata for the forks.
   */
  async getAllProjectForks(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    page: number,
    limit: number
  ): Promise<
    PaginatedResponse<{
      id: Project['id']
      name: Project['name']
      slug: Project['slug']
      createdAt: Project['createdAt']
      updatedAt: Project['updatedAt']
    }>
  > {
    this.logger.log(
      `User ${user.id} attempted to get all forks of project ${projectSlug}`
    )

    this.logger.log(
      `Checking if user has authority to read project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.READ_PROJECT]
      })
    const projectId = project.id

    this.logger.log(`Fetching all forks of project ${projectSlug}`)
    const forks = await this.prisma.project.findMany({
      where: {
        forkedFromId: projectId
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true
      }
    })
    this.logger.log(`Found ${forks.length} forks of project ${projectSlug}`)

    this.logger.log(
      `Filtering forks that the user has access to for project ${projectSlug}`
    )
    const forksAllowed: {
      id: Project['id']
      name: Project['name']
      slug: Project['slug']
      createdAt: Project['createdAt']
      updatedAt: Project['updatedAt']
    }[] = []
    for (const fork of forks) {
      try {
        await this.authorizationService.authorizeUserAccessToProject({
          user,
          slug: fork.slug,
          authorities: [Authority.READ_PROJECT]
        })
        forksAllowed.push(fork)
      } catch (_ignored) {}
    }
    this.logger.log(
      `Found ${forksAllowed.length} forks of project ${projectSlug} that the user has access to`
    )

    const items = forksAllowed.slice(page * limit, (page + 1) * limit)

    // Calculate metadata
    const metadata = paginate(
      forksAllowed.length,
      `/project/${projectSlug}/forks`,
      {
        page,
        limit: limitMaxItemsPerPage(limit)
      }
    )

    return { items, metadata }
  }

  /**
   * Gets a project by slug.
   *
   * @param user The user who is requesting the project
   * @param projectSlug The slug of the project to get
   * @returns The project with secrets removed
   *
   * @throws UnauthorizedException If the user does not have the authority to read the project
   */
  async getProject(
    user: AuthenticatedUser,
    projectSlug: Project['slug']
  ): Promise<HydratedProject> {
    this.logger.log(`User ${user.id} attempted to get project ${projectSlug}`)

    this.logger.log(
      `Checking if user has authority to read project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.READ_PROJECT]
      })

    project.privateKey =
      project.privateKey != null ? sDecrypt(project.privateKey) : null

    return project
  }

  /**
   * Gets all the projects in a workspace that the user has access to.
   *
   * @param user The user who is requesting the projects
   * @param workspaceSlug The slug of the workspace to get the projects from
   * @param page The page number to get the projects for
   * @param limit The number of projects to get per page
   * @param sort The field to sort the projects by
   * @param order The order to sort the projects in
   * @param search The search string to filter the projects by
   * @returns An object with two properties: `items` and `metadata`.
   * `items` is an array of project objects that match the given criteria,
   * and `metadata` is an object with pagination metadata.
   */
  async getProjectsOfWorkspace(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<PaginatedResponse<HydratedProject>> {
    this.logger.log(
      `User ${user.id} attempted to get all projects of workspace ${workspaceSlug}`
    )

    this.logger.log(
      `Checking if user has authority to read projects of workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        slug: workspaceSlug,
        authorities: [Authority.READ_PROJECT]
      })
    const workspaceId = workspace.id

    // Fetch projects with required properties
    this.logger.log(`Fetching all projects of workspace ${workspaceSlug}`)
    const projects = (
      await this.prisma.project.findMany({
        skip: page * limit,
        take: limitMaxItemsPerPage(limit),
        orderBy: {
          [sort]: order
        },
        where: {
          workspaceId,
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              description: {
                contains: search
              }
            }
          ]
        },
        include: InclusionQuery.Project
      })
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))
    this.logger.log(
      `Found ${projects.length} projects of workspace ${workspaceSlug}`
    )

    const hydratedProjects: HydratedProject[] = []
    for (const project of projects) {
      try {
        const hydratedProject =
          await this.authorizationService.authorizeUserAccessToProject({
            user,
            slug: project.slug,
            authorities: [Authority.READ_PROJECT]
          })
        hydratedProjects.push(hydratedProject)
      } catch (_ignored) {
        this.logger.log(
          `User ${user.id} does not have access to project ${project.slug}`
        )
      }
    }

    const metadata = paginate(
      hydratedProjects.length,
      `/project/all/${workspaceSlug}`,
      {
        page,
        limit,
        sort,
        order,
        search
      }
    )

    return { items: hydratedProjects, metadata }
  }

  /**
   * Returns an export of the project configurations (secrets and variables)
   * in the desired format
   *
   * @param user The user who is requesting the project secrets
   * @param projectSlug The slug of the project to export secrets from
   * @param environmentSlugs
   * @param format The format to export the secrets in
   * @returns The secrets exported in the desired format
   *
   * @throws UnauthorizedException If the user does not have the authority to read the project, secrets, variables and environments
   * @throws BadRequestException If the private key is required but not supplied
   */
  async exportProjectConfigurations(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    environmentSlugs: Environment['slug'][],
    format: ExportFormat
  ) {
    this.logger.log(
      `User ${user.id} attempted to export secrets in project ${projectSlug}`
    )

    const environmentExports = await Promise.all(
      environmentSlugs.map(async (environmentSlug) => {
        const rawSecrets =
          await this.secretService.getAllSecretsOfProjectAndEnvironment(
            user,
            projectSlug,
            environmentSlug
          )

        const secrets = rawSecrets.map((secret) => ({
          name: secret.name,
          value: secret.value
        }))

        const variables = (
          await this.variableService.getAllVariablesOfProjectAndEnvironment(
            user,
            projectSlug,
            environmentSlug
          )
        ).map((variable) => ({
          name: variable.name,
          value: variable.value
        }))

        return [
          environmentSlug,
          this.exportService.format({ secrets, variables }, format)
        ]
      })
    )

    return Object.fromEntries(environmentExports)
  }

  private isProjectForked(project: Project) {
    if (!project.isForked || project.forkedFromId == null) {
      this.logger.error(`Project ${project.slug} is not a forked project`)
      throw new BadRequestException(
        constructErrorBody(
          'Not a forked project',
          `Project ${project.slug} is not a forked project`
        )
      )
    } else {
      this.logger.log(`Project ${project.slug} is a forked project`)
    }
  }

  /**
   * Checks if a project with a given name exists in a workspace.
   *
   * @param projectName The name of the project to check
   * @param workspaceId The ID of the workspace to check in
   * @returns true if the project exists, false otherwise
   */
  private async projectExists(
    projectName: string,
    workspaceId: Workspace['id']
  ): Promise<void> {
    this.logger.log(
      `Checking if project ${projectName} exists in workspace ${workspaceId}`
    )

    const projectExist: boolean =
      (await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          workspace: {
            projects: {
              some: {
                name: projectName
              }
            }
          }
        }
      })) > 0

    if (projectExist) {
      this.logger.error(
        `Project ${projectName} already exists in workspace ${workspaceId}`
      )
      throw new ConflictException(
        constructErrorBody(
          'Project already exists',
          `Project ${projectName} already exists in the workspace`
        )
      )
    } else {
      this.logger.log(
        `Project ${projectName} does not exist in workspace ${workspaceId}`
      )
    }
  }

  /**
   * Copies the project data from one project to another project.
   *
   * @param user The user who is performing the copy operation
   * @param fromProject The project from which the data is being copied
   * @param toProject The project to which the data is being copied
   * @param hardCopy If true, replace all the data in the toProject with the fromProject,
   * otherwise, only add the items in the fromProject that are not already present in the toProject.
   * @returns An array of database operations that need to be performed to copy the data.
   */
  private async copyProjectData(
    user: AuthenticatedUser,
    fromProject: {
      id: Project['id']
      privateKey: string // Need the private key to decrypt the secrets
    },
    toProject: {
      id: Project['id']
      publicKey: string // Need the public key to encrypt the secrets
    },
    // hardCopy = true: Replace everything in the toProject with the fromProject
    // hardCopy = false: Only add those items in the toProject that are not already present in it
    hardCopy: boolean = false
  ) {
    this.logger.log(
      `Copying data from project ${fromProject.id} to project ${toProject.id}`
    )

    // This field will be populated if hardCopy is true
    // When we are doing a hard copy, we need to delete all the
    // items in the toProject that are already present in it
    const deleteOps = []

    // Get all the environments that belongs to the parent project
    // and replicate them for the new project
    const createEnvironmentOps = []
    const envNameToIdMap = {}

    // These fields will be populated if hardCopy is false
    // When we are doing a soft copy, we would only like to add those
    // items in the toProject that are not already present in it with
    // comparison to the fromProject
    const toProjectEnvironments: Set<Environment['name']> = new Set()
    const toProjectSecrets: Set<Secret['name']> = new Set()
    const toProjectVariables: Set<Variable['name']> = new Set()

    if (!hardCopy) {
      this.logger.log(
        `Soft copy operation from project ${fromProject.id} to project ${toProject.id}`
      )

      const [environments, secrets, variables] = await this.prisma.$transaction(
        [
          this.prisma.environment.findMany({
            where: {
              projectId: toProject.id
            }
          }),
          this.prisma.secret.findMany({
            where: {
              projectId: toProject.id
            }
          }),
          this.prisma.variable.findMany({
            where: {
              projectId: toProject.id
            }
          })
        ]
      )

      this.logger.log(
        `Found ${environments.length} environments, ${secrets.length} secrets and ${variables.length} variables in project ${toProject.id}`
      )

      environments.forEach((env) => {
        envNameToIdMap[env.name] = env.id
        toProjectEnvironments.add(env.name)
      })

      secrets.forEach((secret) => {
        toProjectSecrets.add(secret.name)
      })

      variables.forEach((variable) => {
        toProjectVariables.add(variable.name)
      })
    } else {
      this.logger.log(
        `Hard copy operation from project ${fromProject.id} to project ${toProject.id}`
      )

      deleteOps.push(
        this.prisma.environment.deleteMany({
          where: {
            projectId: toProject.id
          }
        })
      )

      deleteOps.push(
        this.prisma.secret.deleteMany({
          where: {
            projectId: toProject.id
          }
        })
      )

      deleteOps.push(
        this.prisma.variable.deleteMany({
          where: {
            projectId: toProject.id
          }
        })
      )
    }

    // We want to find all such environments in the fromProject that
    // is not present in the toProject. You can think of this as a set
    // difference operation.
    // In case of a hard copy, we would just copy all the environments
    // since toProjectEnvironments will be empty.
    this.logger.log(
      `Finding environments that are not present in project ${toProject.id} but are present in project ${fromProject.id}`
    )
    const missingEnvironments = await this.prisma.environment.findMany({
      where: {
        projectId: fromProject.id,
        name: {
          notIn: Array.from(toProjectEnvironments)
        }
      }
    })
    this.logger.log(
      `Found ${missingEnvironments.length} environments that are not present in project ${toProject.id}`
    )

    // For all the new environments that we are creating, we want to map
    // the name of the environment to the id of the newly created environment
    for (const environment of missingEnvironments) {
      const newEnvironmentId = v4()
      envNameToIdMap[environment.name] = newEnvironmentId

      createEnvironmentOps.push(
        this.prisma.environment.create({
          data: {
            id: newEnvironmentId,
            name: environment.name,
            slug: await this.slugGenerator.generateEntitySlug(
              environment.name,
              'ENVIRONMENT'
            ),
            description: environment.description,
            projectId: toProject.id,
            lastUpdatedById: user.id
          }
        })
      )
    }

    const createSecretOps = []

    // Get all the secrets that belongs to the parent project and
    // replicate them for the new project. This too is a set difference
    // operation.
    this.logger.log(
      `Finding secrets that are not present in project ${toProject.id} but are present in project ${fromProject.id}`
    )
    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId: fromProject.id,
        name: {
          notIn: Array.from(toProjectSecrets)
        }
      },
      include: {
        versions: {
          include: {
            environment: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    for (const secret of secrets) {
      const secretVersions = secret.versions.map(async (version) => ({
        value: await encrypt(
          toProject.publicKey,
          await decrypt(fromProject.privateKey, version.value)
        ),
        version: version.version,
        environmentName: version.environment.name
      }))

      createSecretOps.push(
        this.prisma.secret.create({
          data: {
            name: secret.name,
            slug: await this.slugGenerator.generateEntitySlug(
              secret.name,
              'SECRET'
            ),
            projectId: toProject.id,
            lastUpdatedById: user.id,
            note: secret.note,
            rotateAt: secret.rotateAt,
            versions: {
              create: await Promise.all(
                secretVersions.map(async (secretVersion) => {
                  const awaitedSecretVersion = await secretVersion
                  return {
                    value: awaitedSecretVersion.value,
                    version: awaitedSecretVersion.version,
                    environmentId:
                      envNameToIdMap[awaitedSecretVersion.environmentName],
                    createdById: user.id
                  }
                })
              )
            }
          }
        })
      )
    }

    // Get all the variables that belongs to the parent project and
    // replicate them for the new project
    const createVariableOps = []

    this.logger.log(
      `Finding variables that are not present in project ${toProject.id} but are present in project ${fromProject.id}`
    )
    const variables = await this.prisma.variable.findMany({
      where: {
        projectId: fromProject.id,
        name: {
          notIn: Array.from(toProjectVariables)
        }
      },
      include: {
        versions: {
          include: {
            environment: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    for (const variable of variables) {
      createVariableOps.push(
        this.prisma.variable.create({
          data: {
            name: variable.name,
            slug: await this.slugGenerator.generateEntitySlug(
              variable.name,
              'VARIABLE'
            ),
            projectId: toProject.id,
            lastUpdatedById: user.id,
            note: variable.note,
            versions: {
              create: variable.versions.map((version) => ({
                value: version.value,
                version: version.version,
                createdById: user.id,
                environmentId: envNameToIdMap[version.environment.name]
              }))
            }
          }
        })
      )
    }

    return [
      ...deleteOps,
      ...createEnvironmentOps,
      ...createSecretOps,
      ...createVariableOps
    ]
  }

  /**
   * Updates the key pair of a project.
   *
   * @param project The project to update
   * @param oldPrivateKey The old private key of the project
   * @param storePrivateKey Whether to store the new private key in the database
   *
   * @returns An object with three properties:
   * - `txs`: an array of database operations that need to be performed to update the project
   * - `newPrivateKey`: the new private key of the project
   * - `newPublicKey`: the new public key of the project
   */
  private async updateProjectKeyPair(
    projectId: Project['id'],
    oldPrivateKey: string,
    storePrivateKey: boolean
  ) {
    // A new key pair can be generated only if:
    // - The existing private key is provided
    // - Or, the private key was stored
    const { privateKey: newPrivateKey, publicKey: newPublicKey } =
      createKeyPair()

    const txs = []

    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId: projectId
      },
      include: {
        versions: true
      }
    })

    // Re-hash all secrets
    for (const secret of secrets) {
      const versions = secret.versions

      const updatedVersions: Partial<SecretVersion>[] = []

      // First, encrypt the values with the new key and store
      // them in a temporary array
      for (const version of versions) {
        updatedVersions.push({
          id: version.id,
          value: await encrypt(
            newPublicKey,
            await decrypt(oldPrivateKey, version.value)
          )
        })
      }

      // Apply the changes to the database
      for (const version of updatedVersions) {
        txs.push(
          this.prisma.secretVersion.update({
            where: {
              id: version.id
            },
            data: {
              value: version.value
            }
          })
        )
      }
    }

    // Update the project with the new key pair
    txs.push(
      this.prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          publicKey: newPublicKey,
          privateKey: storePrivateKey ? sEncrypt(newPrivateKey) : null
        }
      })
    )

    return { txs, newPrivateKey, newPublicKey }
  }
}
