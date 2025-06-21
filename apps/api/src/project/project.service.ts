import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException
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
import {
  ExportFormat,
  ProjectWithCounts,
  ProjectWithSecrets
} from './project.types'
import { ForkProject } from './dto/fork.project/fork.project'
import { paginate } from '@/common/paginate'
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

@Injectable()
export class ProjectService {
  private readonly logger: Logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService,
    private readonly slugGenerator: SlugGenerator,
    private readonly secretService: SecretService,
    private readonly variableService: VariableService,
    private readonly exportService: ExportService
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
  ) {
    this.logger.log(`User ${user.id} attempted to create a project ${dto.name}`)

    // Check if the workspace exists or not
    this.logger.log(`Checking if workspace ${workspaceSlug} exists`)
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.CREATE_PROJECT]
      })
    const workspaceId = workspace.id

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

    this.logger.log(`Fetching admin role for workspace ${workspace.slug}`)
    const adminRole = await this.prisma.workspaceRole.findFirst({
      where: {
        workspaceId: workspaceId,
        hasAdminAuthority: true
      }
    })

    if (!adminRole) {
      const errorMessage = `Admin role not found for workspace ${workspace.slug}`
      this.logger.error(
        `User ${user.id} attempted to create a project without an admin role: ${errorMessage}`
      )
      throw new BadRequestException(
        constructErrorBody('Admin role not found', errorMessage)
      )
    }

    this.logger.log(
      `Admin role for workspace ${workspace.slug} is ${adminRole.slug}`
    )

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
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      }
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

    const createEnvironmentOps = []

    // Create and assign the environments provided in the request, if any
    // or create a default environment
    if (dto.environments && dto.environments.length > 0) {
      this.logger.log(
        `Project has ${dto.environments.length} environments to create`
      )
      for (const environment of dto.environments) {
        createEnvironmentOps.push(
          this.prisma.environment.create({
            data: {
              name: environment.name,
              slug: await this.slugGenerator.generateEntitySlug(
                environment.name,
                'ENVIRONMENT'
              ),
              description: environment.description,
              projectId: newProjectId,
              lastUpdatedById: user.id
            }
          })
        )
      }
    } else {
      this.logger.log(`Creating default environment for project ${dto.name}`)
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
      addProjectToAdminRoleOfItsWorkspace,
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

    return {
      ...newProject,
      ...(await this.parseProjectItemLimits(newProject.id))
    }
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
  ) {
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
        entity: { slug: projectSlug },
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
            project,
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
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      }
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
    return {
      ...updatedProject,
      privateKey,
      publicKey
    }
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
  ) {
    this.logger.log(`User ${user.id} attempted to fork project ${projectSlug}`)

    // Check if the user has the authority to read the project
    this.logger.log(
      `Checking if user has authority to read project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_PROJECT]
      })

    let workspaceId = null

    if (forkMetadata.workspaceSlug) {
      this.logger.log(
        `Project to be forked inside workspace ${forkMetadata.workspaceSlug}. Checking for authority`
      )
      const workspace =
        await this.authorizationService.authorizeUserAccessToWorkspace({
          user,
          entity: { slug: forkMetadata.workspaceSlug },
          authorities: [Authority.CREATE_PROJECT]
        })

      workspaceId = workspace.id
    } else {
      this.logger.log(
        `Project to be forked in default workspace. Fetching default workspace`
      )
      const defaultWorkspace = await this.prisma.workspaceMember.findFirst({
        where: {
          userId: user.id,
          workspace: {
            isDefault: true
          }
        }
      })
      workspaceId = defaultWorkspace.workspaceId
    }

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
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      }
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
    return newProject
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
        entity: { slug: projectSlug },
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
        entity: { slug: projectSlug },
        authorities: [Authority.UPDATE_PROJECT]
      })
    const projectId = project.id

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
        entity: { slug: forkedFromProject.slug },
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
        entity: { slug: projectSlug },
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
  ) {
    this.logger.log(
      `User ${user.id} attempted to get all forks of project ${projectSlug}`
    )

    this.logger.log(
      `Checking if user has authority to read project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_PROJECT]
      })
    const projectId = project.id

    this.logger.log(`Fetching all forks of project ${projectSlug}`)
    const forks = await this.prisma.project.findMany({
      where: {
        forkedFromId: projectId
      }
    })
    this.logger.log(`Found ${forks.length} forks of project ${projectSlug}`)

    this.logger.log(
      `Filtering forks that the user has access to for project ${projectSlug}`
    )
    const forksAllowed = await Promise.all(
      forks.map(async (fork) => {
        const allowed =
          (await this.authorizationService.authorizeUserAccessToProject({
            user,
            entity: { slug: fork.slug },
            authorities: [Authority.READ_PROJECT]
          })) !== null

        return { fork, allowed }
      })
    ).then((results) =>
      results.filter((result) => result.allowed).map((result) => result.fork)
    )
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
  async getProject(user: AuthenticatedUser, projectSlug: Project['slug']) {
    this.logger.log(`User ${user.id} attempted to get project ${projectSlug}`)

    this.logger.log(
      `Checking if user has authority to read project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_PROJECT]
      })

    delete project.secrets
    project.privateKey =
      project.privateKey != null ? sDecrypt(project.privateKey) : null

    return {
      ...(await this.countEnvironmentsVariablesAndSecretsInProject(
        project,
        user
      )),
      ...(await this.parseProjectItemLimits(project.id))
    }
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
  ) {
    this.logger.log(
      `User ${user.id} attempted to get all projects of workspace ${workspaceSlug}`
    )

    this.logger.log(
      `Checking if user has authority to read projects of workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
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
          ],
          workspace: {
            members: {
              some: {
                userId: user.id,
                roles: {
                  some: {
                    role: {
                      authorities: {
                        hasSome: [
                          Authority.WORKSPACE_ADMIN,
                          Authority.READ_PROJECT
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        include: {
          lastUpdatedBy: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true
            }
          }
        }
      })
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))
    this.logger.log(
      `Found ${projects.length} projects of workspace ${workspaceSlug}`
    )

    const items = await Promise.all(
      projects.map(async (project) => ({
        ...(await this.countEnvironmentsVariablesAndSecretsInProject(
          project,
          user
        )),
        ...(await this.parseProjectItemLimits(project.id))
      }))
    )

    //calculate metadata
    const totalCount = await this.prisma.project.count({
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
        ],
        workspace: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      }
    })

    const metadata = paginate(totalCount, `/project/all/${workspaceSlug}`, {
      page,
      limit,
      sort,
      order,
      search
    })

    return { items, metadata }
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
    project: ProjectWithSecrets,
    oldPrivateKey: string,
    storePrivateKey: boolean
  ) {
    // A new key pair can be generated only if:
    // - The existing private key is provided
    // - Or, the private key was stored
    const { privateKey: newPrivateKey, publicKey: newPublicKey } =
      createKeyPair()

    const txs = []

    // Re-hash all secrets
    for (const secret of project.secrets) {
      const versions = await this.prisma.secretVersion.findMany({
        where: {
          secretId: secret.id
        }
      })

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
          id: project.id
        },
        data: {
          publicKey: newPublicKey,
          privateKey: storePrivateKey ? sEncrypt(newPrivateKey) : null
        }
      })
    )

    return { txs, newPrivateKey, newPublicKey }
  }

  private async countEnvironmentsVariablesAndSecretsInProject(
    project: Partial<Project>,
    user: AuthenticatedUser
  ): Promise<ProjectWithCounts> {
    this.logger.log(
      `Counting environments, variables and secrets in project ${project.slug}`
    )

    this.logger.log(`Fetching all environments of project ${project.slug}`)
    const allEnvs = await this.prisma.environment.findMany({
      where: { projectId: project.id }
    })
    this.logger.log(
      `Found ${allEnvs.length} environments in project ${project.slug}`
    )

    const permittedEnvironments = []

    this.logger.log(
      `Checking access to all environments of project ${project.slug}`
    )
    for (const env of allEnvs) {
      this.logger.log(
        `Checking access to environment ${env.slug} of project ${project.slug}`
      )
      try {
        const permittedEnv =
          await this.authorizationService.authorizeUserAccessToEnvironment({
            user,
            authorities:
              project.accessLevel == ProjectAccessLevel.GLOBAL
                ? []
                : [
                    Authority.READ_ENVIRONMENT,
                    Authority.READ_SECRET,
                    Authority.READ_VARIABLE
                  ],
            entity: { slug: env.slug }
          })

        this.logger.log(
          `User has access to environment ${env.slug} of project ${project.slug}`
        )
        permittedEnvironments.push(permittedEnv)
      } catch (e) {
        this.logger.log(
          `User does not have access to environment ${env.slug} of project ${project.slug}`
        )
      }
    }

    const envPromises = permittedEnvironments.map(async (env: Environment) => {
      const fetchSecretCount = this.prisma.secret.count({
        where: {
          projectId: project.id,
          versions: { some: { environmentId: env.id } }
        }
      })

      const fetchVariableCount = this.prisma.variable.count({
        where: {
          projectId: project.id,
          versions: { some: { environmentId: env.id } }
        }
      })

      return this.prisma.$transaction([fetchSecretCount, fetchVariableCount])
    })

    this.logger.log(
      `Fetching counts of variables and secrets in project ${project.slug}`
    )
    const counts = await Promise.all(envPromises)
    const secretCount = counts.reduce(
      (sum, [secretCount]) => sum + secretCount,
      0
    )
    const variableCount = counts.reduce(
      (sum, [, variableCount]) => sum + variableCount,
      0
    )
    this.logger.log(
      `Found ${variableCount} variables and ${secretCount} secrets in project ${project.slug}`
    )

    return {
      ...project,
      environmentCount: permittedEnvironments.length,
      variableCount,
      secretCount
    }
  }

  /**
   * Returns the project with additional information about the limits of items
   * in the project and the current count of items.
   *
   * @param project The project to parse
   * @returns The project with the following additional properties:
   * - maxAllowedEnvironments: The maximum number of environments allowed in the project
   * - totalEnvironments: The current number of environments in the project
   * - maxAllowedSecrets: The maximum number of secrets allowed in the project
   * - totalSecrets: The current number of secrets in the project
   * - maxAllowedVariables: The maximum number of variables allowed in the project
   * - totalVariables: The current number of variables in the project
   */
  private async parseProjectItemLimits(projectId: Project['id']): Promise<{
    maxAllowedEnvironments: number
    totalEnvironments: number
    maxAllowedSecrets: number
    totalSecrets: number
    maxAllowedVariables: number
    totalVariables: number
  }> {
    this.logger.log(`Parsing project item limits for project ${projectId}`)

    this.logger.log(`Getting environment tier limit for project ${projectId}`)
    // Get the tier limit for environments in the project
    const maxAllowedEnvironments =
      this.tierLimitService.getEnvironmentTierLimit(projectId)

    // Get the total number of environments in the project
    const totalEnvironments = await this.prisma.environment.count({
      where: {
        projectId
      }
    })
    this.logger.log(
      `Found ${totalEnvironments} environments in project ${projectId}`
    )

    this.logger.log(`Getting secret tier limit for project ${projectId}`)
    // Get the tier limit for secrets in the project
    const maxAllowedSecrets =
      this.tierLimitService.getSecretTierLimit(projectId)

    // Get the total number of secrets in the project
    const totalSecrets = await this.prisma.secret.count({
      where: {
        projectId
      }
    })
    this.logger.log(`Found ${totalSecrets} secrets in project ${projectId}`)

    this.logger.log(`Getting variable tier limit for project ${projectId}`)
    // Get the tier limit for variables in the project
    const maxAllowedVariables =
      this.tierLimitService.getVariableTierLimit(projectId)

    // Get the total number of variables in the project
    const totalVariables = await this.prisma.variable.count({
      where: {
        projectId
      }
    })
    this.logger.log(`Found ${totalVariables} variables in project ${projectId}`)

    return {
      maxAllowedEnvironments,
      totalEnvironments,
      maxAllowedSecrets,
      totalSecrets,
      maxAllowedVariables,
      totalVariables
    }
  }

  /**
   * Returns an export of the project configurations (secrets and variables)
   * in the desidered format
   *
   * @param user The user who is requesting the project secrets
   * @param projectSlug The slug of the project to export secrets from
   * @param environmentSlug The slug of the environment to export secrets from
   * @param format The format to export the secrets in
   * @param privateKey The private key to use for secret decryption
   * @param separateFiles When `true`, writes secrets and variables into separate files (`secrets.*` & `variables.*`).
   * When `false`, merges both into a single file.
   * @returns The secrets exported in the desired format
   *
   * @throws UnauthorizedException If the user does not have the authority to read the project, secrets, variables and environments
   * @throws BadRequestException If the private key is required but not supplied
   */
  async exportProjectConfigurations(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    environmentSlugs: Environment['slug'][],
    format: ExportFormat,
    separateFiles = false
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

        return separateFiles
          ? [
              [
                `${environmentSlug}.variables`,
                this.exportService.format({ variables }, format)
              ],
              [
                `${environmentSlug}.secrets`,
                this.exportService.format({ secrets }, format)
              ]
            ]
          : [
              [
                environmentSlug,
                this.exportService.format({ secrets, variables }, format)
              ]
            ]
      })
    )

    const fileData = Object.fromEntries(environmentExports.flat())

    if (Object.keys(fileData).length === 0) {
      this.logger.warn(
        `No configuration files generated — metadata=${JSON.stringify({
          project: projectSlug,
          environments: environmentSlugs,
          user: user.id,
          action: 'exportProjectConfigurations'
        })}`
      )

      const errorMessage = `Could not build any configuration files for project "${projectSlug}" in environments [${environmentSlugs.join(', ')}]`

      throw new UnprocessableEntityException(
        constructErrorBody('No configuration present', errorMessage)
      )
    }

    return fileData
  }
}
