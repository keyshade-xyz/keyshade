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
  User,
  Variable,
  Workspace
} from '@prisma/client'
import { CreateProject } from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { PrismaService } from '@/prisma/prisma.service'
import { v4 } from 'uuid'
import { ProjectWithCounts, ProjectWithSecrets } from '../project.types'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { ForkProject } from '../dto/fork.project/fork.project'
import { paginate } from '@/common/paginate'
import { createKeyPair, decrypt, encrypt } from '@/common/cryptography'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import {
  constructErrorBody,
  excludeFields,
  limitMaxItemsPerPage
} from '@/common/util'

@Injectable()
export class ProjectService {
  private readonly log: Logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
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
    user: User,
    workspaceSlug: Workspace['slug'],
    dto: CreateProject
  ) {
    // Check if the workspace exists or not
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.CREATE_PROJECT],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

    // Check if project with this name already exists for the user
    if (await this.projectExists(dto.name, workspaceId))
      throw new ConflictException(
        constructErrorBody(
          'Project already exists',
          `Project with name ${dto.name} already exists in workspace ${workspace.slug}`
        )
      )

    // Create the public and private key pair
    const { publicKey, privateKey } = createKeyPair()

    const data: any = {
      name: dto.name,
      slug: await generateEntitySlug(dto.name, 'PROJECT', this.prisma),
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
      data.privateKey = privateKey
    }

    const userId = user.id

    const newProjectId = v4()

    const adminRole = await this.prisma.workspaceRole.findFirst({
      where: {
        workspaceId: workspaceId,
        hasAdminAuthority: true
      }
    })

    // Create and return the project
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
      for (const environment of dto.environments) {
        createEnvironmentOps.push(
          this.prisma.environment.create({
            data: {
              name: environment.name,
              slug: await generateEntitySlug(
                environment.name,
                'ENVIRONMENT',
                this.prisma
              ),
              description: environment.description,
              projectId: newProjectId,
              lastUpdatedById: user.id
            }
          })
        )
      }
    } else {
      createEnvironmentOps.push(
        this.prisma.environment.create({
          data: {
            name: 'default',
            slug: await generateEntitySlug(
              'default',
              'ENVIRONMENT',
              this.prisma
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

    this.log.debug(`Created project ${newProject}`)

    // It is important that we log before the private key is set
    // in order to not log the private key
    newProject.privateKey = privateKey

    return newProject
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
    user: User,
    projectSlug: Project['slug'],
    dto: UpdateProject
  ) {
    // Check if the user has the authority to update the project
    let authority: Authority = Authority.UPDATE_PROJECT

    // Only admins can change the visibility of the project
    if (dto.accessLevel) authority = Authority.WORKSPACE_ADMIN

    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [authority],
        prisma: this.prisma
      })

    // Check if project with this name already exists for the user
    if (
      (dto.name && (await this.projectExists(dto.name, user.id))) ||
      project.name === dto.name
    )
      throw new ConflictException(
        constructErrorBody(
          'Project already exists',
          `Project with this name **${dto.name}** already exists`
        )
      )

    if (dto.accessLevel) {
      const currentAccessLevel = project.accessLevel

      if (
        currentAccessLevel !== ProjectAccessLevel.GLOBAL &&
        dto.accessLevel === ProjectAccessLevel.GLOBAL
      ) {
        // If the project is being made global, the private key must be stored
        // This is because we want anyone to see the secrets in the project
        dto.storePrivateKey = true
        dto.privateKey = dto.privateKey || project.privateKey

        // We can't make the project global if a private key isn't supplied,
        // because we need to decrypt the secrets
        if (!dto.privateKey) {
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
        dto.storePrivateKey = false
        dto.regenerateKeyPair = true

        // At this point, we already will have the private key since the project is global
        dto.privateKey = project.privateKey
      }
    }

    const data: Partial<Project> = {
      name: dto.name,
      slug: dto.name
        ? await generateEntitySlug(dto.name, 'PROJECT', this.prisma)
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
      data.isForked = false
      data.forkedFromId = null
    }

    const versionUpdateOps = []
    let privateKey = dto.privateKey
    let publicKey = project.publicKey

    if (dto.regenerateKeyPair) {
      if (dto.privateKey || project.privateKey) {
        const { txs, newPrivateKey, newPublicKey } =
          await this.updateProjectKeyPair(
            project,
            dto.privateKey || project.privateKey,
            dto.storePrivateKey
          )

        privateKey = newPrivateKey
        publicKey = newPublicKey

        versionUpdateOps.push(...txs)
      } else {
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

    this.log.debug(`Updated project ${updatedProject.id}`)
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
    user: User,
    projectSlug: Project['slug'],
    forkMetadata: ForkProject
  ) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })

    let workspaceId = null

    if (forkMetadata.workspaceSlug) {
      const workspace =
        await this.authorityCheckerService.checkAuthorityOverWorkspace({
          userId: user.id,
          entity: { slug: forkMetadata.workspaceSlug },
          authorities: [Authority.CREATE_PROJECT],
          prisma: this.prisma
        })

      workspaceId = workspace.id
    } else {
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

    // Check if project with this name already exists for the user
    if (await this.projectExists(newProjectName, workspaceId))
      throw new ConflictException(
        constructErrorBody(
          'Project already exists',
          `Project with name ${newProjectName} already exists in the selected workspace`
        )
      )

    const { privateKey, publicKey } = createKeyPair()
    const userId = user.id
    const newProjectId = v4()
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
        slug: await generateEntitySlug(newProjectName, 'PROJECT', this.prisma),
        description: project.description,
        storePrivateKey:
          forkMetadata.storePrivateKey || project.storePrivateKey,
        publicKey: publicKey,
        privateKey:
          forkMetadata.storePrivateKey || project.storePrivateKey
            ? privateKey
            : null,
        accessLevel: project.accessLevel,
        isForked: true,
        forkedFromId: project.id,
        workspaceId: workspaceId,
        lastUpdatedById: userId
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
        privateKey: project.privateKey
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

    this.log.debug(`Created project ${newProject}`)
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
  async unlinkParentOfFork(user: User, projectSlug: Project['slug']) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.UPDATE_PROJECT],
        prisma: this.prisma
      })
    const projectId = project.id

    await this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        isForked: false,
        forkedFromId: null
      }
    })
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
  async syncFork(user: User, projectSlug: Project['slug'], hardSync: boolean) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.UPDATE_PROJECT],
        prisma: this.prisma
      })
    const projectId = project.id

    if (!project.isForked || project.forkedFromId == null) {
      throw new BadRequestException(
        constructErrorBody(
          'Not a forked project',
          `Project ${projectSlug} is not a forked project`
        )
      )
    }

    const forkedFromProject = await this.prisma.project.findUnique({
      where: {
        id: project.forkedFromId
      }
    })

    const parentProject =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: forkedFromProject.slug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })

    const copyProjectOp = await this.copyProjectData(
      user,
      {
        id: parentProject.id,
        privateKey: parentProject.privateKey
      },
      {
        id: projectId,
        publicKey: project.publicKey
      },
      hardSync
    )

    await this.prisma.$transaction(copyProjectOp)
  }

  /**
   * Deletes a project.
   * @param user The user who is deleting the project
   * @param projectSlug The slug of the project to delete
   *
   * @throws UnauthorizedException If the user does not have the authority to delete the project
   */
  async deleteProject(user: User, projectSlug: Project['slug']) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.DELETE_PROJECT],
        prisma: this.prisma
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

    this.log.debug(`Deleted project ${project}`)
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
    user: User,
    projectSlug: Project['slug'],
    page: number,
    limit: number
  ) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })
    const projectId = project.id

    const forks = await this.prisma.project.findMany({
      where: {
        forkedFromId: projectId
      }
    })

    const forksAllowed = forks.filter(async (fork) => {
      const allowed =
        (await this.authorityCheckerService.checkAuthorityOverProject({
          userId: user.id,
          entity: { slug: fork.slug },
          authorities: [Authority.READ_PROJECT],
          prisma: this.prisma
        })) != null

      return allowed
    })

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
  async getProject(user: User, projectSlug: Project['slug']) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })

    delete project.secrets

    return await this.countEnvironmentsVariablesAndSecretsInProject(
      project,
      user
    )
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
    user: User,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

    //fetch projects with required properties
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
        }
      })
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))

    const items = await Promise.all(
      projects.map(async (project) =>
        this.countEnvironmentsVariablesAndSecretsInProject(project, user)
      )
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
  ): Promise<boolean> {
    return (
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
    )
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
    user: User,
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
    const missingEnvironments = await this.prisma.environment.findMany({
      where: {
        projectId: fromProject.id,
        name: {
          notIn: Array.from(toProjectEnvironments)
        }
      }
    })

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
            slug: await generateEntitySlug(
              environment.name,
              'ENVIRONMENT',
              this.prisma
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
            slug: await generateEntitySlug(secret.name, 'SECRET', this.prisma),
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
            slug: await generateEntitySlug(
              variable.name,
              'VARIABLE',
              this.prisma
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
            await decrypt(oldPrivateKey, version.value),
            newPrivateKey
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
          privateKey: storePrivateKey ? newPrivateKey : null
        }
      })
    )

    return { txs, newPrivateKey, newPublicKey }
  }

  private async countEnvironmentsVariablesAndSecretsInProject(
    project: Partial<Project>,
    user: User
  ): Promise<ProjectWithCounts> {
    let environmentCount = 0
    let variableCount = 0
    let secretCount = 0
    // When we later implement RBAC for environments, we would need to updated
    // this code to only include environments like we do while fetching projects.

    // What would be even better is, we should fetch environments directly. And then,
    // accumulate the projects into a set of projects. And then, return that set along
    // with the required data.
    const allEnvs = await this.prisma.environment.findMany({
      where: { projectId: project.id }
    })

    // This entire block will become invalid after RBAC for environments are implemented
    const envPromises = allEnvs.map(async (env) => {
      const hasRequiredPermission =
        await this.authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { slug: env.slug },
          authorities:
            project.accessLevel == ProjectAccessLevel.GLOBAL
              ? []
              : [
                  Authority.READ_ENVIRONMENT,
                  Authority.READ_SECRET,
                  Authority.READ_VARIABLE
                ],
          prisma: this.prisma
        })
      if (hasRequiredPermission) {
        environmentCount += 1

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
      }
      return [0, 0]
    })
    const counts = await Promise.all(envPromises)
    secretCount = counts.reduce((sum, [secretCount]) => sum + secretCount, 0)
    variableCount = counts.reduce(
      (sum, [, variableCount]) => sum + variableCount,
      0
    )
    return {
      ...project,
      environmentCount,
      variableCount,
      secretCount
    }
  }
}
