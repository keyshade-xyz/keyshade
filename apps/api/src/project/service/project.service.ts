import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger
} from '@nestjs/common'
import {
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
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
import { createKeyPair } from '../../common/create-key-pair'
import { excludeFields } from '../../common/exclude-fields'
import { PrismaService } from '../../prisma/prisma.service'
import { decrypt } from '../../common/decrypt'
import { encrypt } from '../../common/encrypt'
import { v4 } from 'uuid'
import createEvent from '../../common/create-event'
import workspaceApprovalEnabled from '../../common/workspace-approval-enabled'
import createApproval from '../../common/create-approval'
import { UpdateProjectMetadata } from '../../approval/approval.types'
import { ProjectWithSecrets } from '../project.types'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { ForkProject } from '../dto/fork.project/fork.project'
import { SecretWithEnvironment } from 'src/secret/secret.types'
import { VariableWithEnvironment } from 'src/variable/variable.types'

@Injectable()
export class ProjectService {
  private readonly log: Logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async createProject(
    user: User,
    workspaceId: Workspace['id'],
    dto: CreateProject,
    reason?: string
  ) {
    // Check if the workspace exists or not
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.CREATE_PROJECT,
        prisma: this.prisma
      })

    // Check if project with this name already exists for the user
    if (await this.projectExists(dto.name, workspaceId))
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
      )

    // Create the public and private key pair
    const { publicKey, privateKey } = createKeyPair()

    const approvalEnabled = await workspaceApprovalEnabled(
      workspaceId,
      this.prisma
    )

    const data: any = {
      name: dto.name,
      description: dto.description,
      storePrivateKey:
        dto.accessLevel === ProjectAccessLevel.GLOBAL
          ? true
          : dto.storePrivateKey, // If the project is global, the private key must be stored
      publicKey,
      accessLevel: dto.accessLevel,
      pendingCreation: approvalEnabled
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
      let defaultEnvironmentExists = false
      for (const environment of dto.environments) {
        createEnvironmentOps.push(
          this.prisma.environment.create({
            data: {
              name: environment.name,
              description: environment.description,
              isDefault:
                defaultEnvironmentExists === false
                  ? environment.isDefault
                  : false,
              projectId: newProjectId,
              lastUpdatedById: user.id
            }
          })
        )

        defaultEnvironmentExists =
          defaultEnvironmentExists || environment.isDefault
      }
    } else {
      createEnvironmentOps.push(
        this.prisma.environment.create({
          data: {
            name: 'Default',
            description: 'Default environment for the project',
            isDefault: true,
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

    if (approvalEnabled) {
      const approval = await createApproval(
        {
          action: ApprovalAction.CREATE,
          itemType: ApprovalItemType.PROJECT,
          itemId: newProjectId,
          reason,
          user,
          workspaceId
        },
        this.prisma
      )
      return {
        project: newProject,
        approval
      }
    } else {
      return newProject
    }
  }

  async updateProject(
    user: User,
    projectId: Project['id'],
    dto: UpdateProject,
    reason?: string
  ) {
    // Check if the user has the authority to update the project
    let authority: Authority = Authority.UPDATE_PROJECT

    // Only admins can change the visibility of the project
    if (dto.accessLevel) authority = Authority.WORKSPACE_ADMIN

    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority,
        prisma: this.prisma
      })

    // Check if project with this name already exists for the user
    if (
      (dto.name && (await this.projectExists(dto.name, user.id))) ||
      project.name === dto.name
    )
      throw new ConflictException(
        `Project with this name **${dto.name}** already exists`
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
            'Private key is required to make the project GLOBAL'
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

    if (
      !project.pendingCreation &&
      (await workspaceApprovalEnabled(project.workspaceId, this.prisma))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.PROJECT,
          itemId: projectId,
          reason,
          user,
          workspaceId: project.workspaceId,
          metadata: dto
        },
        this.prisma
      )
    } else {
      return this.update(dto, user, project)
    }
  }

  async forkProject(
    user: User,
    projectId: Project['id'],
    forkMetadata: ForkProject
  ) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.READ_PROJECT,
        prisma: this.prisma
      })

    let workspaceId = forkMetadata.workspaceId

    if (workspaceId) {
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.CREATE_PROJECT,
        prisma: this.prisma
      })
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
        `Project with this name **${newProjectName}** already exists in the selected workspace`
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
        description: project.description,
        storePrivateKey:
          forkMetadata.storePrivateKey || project.storePrivateKey,
        publicKey: publicKey,
        privateKey:
          forkMetadata.storePrivateKey || project.storePrivateKey
            ? privateKey
            : null,
        accessLevel: project.accessLevel,
        pendingCreation: false,
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

  async unlinkParentOfFork(user: User, projectId: Project['id']) {
    await this.authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: projectId },
      authority: Authority.UPDATE_PROJECT,
      prisma: this.prisma
    })

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

  async syncFork(user: User, projectId: Project['id'], hardSync: boolean) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.UPDATE_PROJECT,
        prisma: this.prisma
      })

    if (!project.isForked || project.forkedFromId == null) {
      throw new BadRequestException(
        `Project with id ${projectId} is not a forked project`
      )
    }

    const parentProject =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: project.forkedFromId },
        authority: Authority.READ_PROJECT,
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

  async deleteProject(user: User, projectId: Project['id'], reason?: string) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.DELETE_PROJECT,
        prisma: this.prisma
      })

    if (await workspaceApprovalEnabled(project.workspaceId, this.prisma)) {
      return await createApproval(
        {
          action: ApprovalAction.DELETE,
          itemType: ApprovalItemType.PROJECT,
          itemId: projectId,
          reason,
          user,
          workspaceId: project.workspaceId
        },
        this.prisma
      )
    } else {
      return this.delete(user, project)
    }
  }

  async getAllProjectForks(
    user: User,
    projectId: Project['id'],
    page: number,
    limit: number
  ) {
    await this.authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: projectId },
      authority: Authority.READ_PROJECT,
      prisma: this.prisma
    })

    const forks = await this.prisma.project.findMany({
      where: {
        forkedFromId: projectId
      }
    })

    return forks
      .slice(page * limit, (page + 1) * limit)
      .filter(async (fork) => {
        const allowed =
          (await this.authorityCheckerService.checkAuthorityOverProject({
            userId: user.id,
            entity: { id: fork.id },
            authority: Authority.READ_PROJECT,
            prisma: this.prisma
          })) != null

        return allowed
      })
  }

  async getProjectById(user: User, projectId: Project['id']) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.READ_PROJECT,
        prisma: this.prisma
      })

    delete project.secrets

    return project
  }

  async getProjectsOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_PROJECT,
      prisma: this.prisma
    })

    return (
      await this.prisma.project.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          [sort]: order
        },
        where: {
          pendingCreation: false,
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
    ).map((project) => excludeFields(project, 'privateKey', 'publicKey'))
  }

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
                name: projectName,
                pendingCreation: false
              }
            }
          }
        }
      })) > 0
    )
  }

  async makeProjectApproved(projectId: Project['id']) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    })

    // Check if a project with this name already exists
    const projectExists = await this.prisma.project.count({
      where: {
        name: project.name,
        pendingCreation: false,
        workspaceId: project.workspaceId
      }
    })

    if (projectExists > 0) {
      throw new ConflictException(
        `Project with this name ${project.name} already exists`
      )
    }

    return this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        pendingCreation: false,
        environments: {
          updateMany: {
            where: {
              projectId
            },
            data: {
              pendingCreation: false
            }
          }
        },
        secrets: {
          updateMany: {
            where: {
              projectId
            },
            data: {
              pendingCreation: false
            }
          }
        },
        variables: {
          updateMany: {
            where: {
              projectId
            },
            data: {
              pendingCreation: false
            }
          }
        }
      }
    })
  }

  private async copyProjectData(
    user: User,
    fromProject: {
      id: Project['id']
      privateKey: string
    },
    toProject: {
      id: Project['id']
      publicKey: string
    },
    hardCopy: boolean = false
  ) {
    // Get all the environments that belongs to the parent project
    // and replicate them for the new project
    const createEnvironmentOps = []
    const envNameToIdMap = {}

    // These fields will be populated if hardCopy is false
    // When we are doing a soft copy, we would only like to add those
    // items in the toProject that are not already present in it with
    // comparison to the fromProject
    const toProjectEnvironments: Set<Environment['name']> = new Set()
    const toProjectSecrets: Set<{
      secret: Secret['name']
      environment: Environment['name']
    }> = new Set()
    const toProjectVariables: Set<{
      variable: Variable['name']
      environment: Environment['name']
    }> = new Set()

    if (!hardCopy) {
      const environments: Environment[] =
        await this.prisma.environment.findMany({
          where: {
            projectId: toProject.id
          }
        })

      environments.forEach((env) => {
        envNameToIdMap[env.name] = env.id
        toProjectEnvironments.add(env.name)
      })

      const secrets: SecretWithEnvironment[] =
        await this.prisma.secret.findMany({
          where: {
            projectId: toProject.id
          },
          include: {
            environment: true
          }
        })

      secrets.forEach((secret) => {
        toProjectSecrets.add({
          secret: secret.name,
          environment: secret.environment.name
        })
      })

      const variables: VariableWithEnvironment[] =
        await this.prisma.variable.findMany({
          where: {
            projectId: toProject.id
          },
          include: {
            environment: true
          }
        })

      variables.forEach((variable) => {
        toProjectVariables.add({
          variable: variable.name,
          environment: variable.environment.name
        })
      })
    }

    const environments = await this.prisma.environment.findMany({
      where: {
        projectId: fromProject.id,
        name: {
          notIn: Array.from(toProjectEnvironments)
        }
      }
    })

    for (const environment of environments) {
      const newEnvironmentId = v4()
      envNameToIdMap[environment.name] = newEnvironmentId

      createEnvironmentOps.push(
        this.prisma.environment.create({
          data: {
            id: newEnvironmentId,
            name: environment.name,
            description: environment.description,
            isDefault: environment.isDefault,
            projectId: toProject.id,
            lastUpdatedById: user.id
          }
        })
      )
    }

    // Get all the secrets that belongs to the parent project and
    // replicate them for the new project
    const createSecretOps = []

    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId: fromProject.id,
        name: {
          notIn: Array.from(toProjectSecrets).map((s) => s.secret)
        },
        environment: {
          name: {
            notIn: Array.from(toProjectSecrets).map((s) => s.environment)
          }
        }
      },
      include: {
        environment: true,
        versions: true
      }
    })

    for (const secret of secrets) {
      const secretVersions = secret.versions.map(async (version) => ({
        value: await encrypt(
          toProject.publicKey,
          await decrypt(fromProject.privateKey, version.value)
        ),
        version: version.version
      }))

      createSecretOps.push(
        this.prisma.secret.create({
          data: {
            name: secret.name,
            environmentId: envNameToIdMap[secret.environment.name],
            projectId: toProject.id,
            lastUpdatedById: user.id,
            note: secret.note,
            rotateAt: secret.rotateAt,
            versions: {
              create: await Promise.all(
                secretVersions.map(async (secretVersion) => ({
                  value: (await secretVersion).value,
                  version: (await secretVersion).version,
                  createdById: user.id
                }))
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
          notIn: Array.from(toProjectVariables).map((v) => v.variable)
        },
        environment: {
          name: {
            notIn: Array.from(toProjectVariables).map((v) => v.environment)
          }
        }
      },
      include: {
        environment: true,
        versions: true
      }
    })

    for (const variable of variables) {
      createVariableOps.push(
        this.prisma.variable.create({
          data: {
            name: variable.name,
            environmentId: envNameToIdMap[variable.environment.name],
            projectId: toProject.id,
            lastUpdatedById: user.id,
            note: variable.note,
            versions: {
              create: variable.versions.map((version) => ({
                value: version.value,
                version: version.version,
                createdById: user.id
              }))
            }
          }
        })
      )
    }

    return [...createEnvironmentOps, ...createSecretOps, ...createVariableOps]
  }

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

      for (const version of versions) {
        updatedVersions.push({
          id: version.id,
          value: await encrypt(
            await decrypt(oldPrivateKey, version.value),
            newPrivateKey
          )
        })
      }

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

  async update(
    dto: UpdateProject | UpdateProjectMetadata,
    user: User,
    project: ProjectWithSecrets
  ) {
    const data: Partial<Project> = {
      name: dto.name,
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
          'Private key is required to regenerate the key pair'
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

  async delete(user: User, project: Project) {
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

    // If the project is in pending creation and the workspace approval is enabled, we need to
    // delete the approval as well
    if (
      project.pendingCreation &&
      (await workspaceApprovalEnabled(project.workspaceId, this.prisma))
    ) {
      op.push(
        this.prisma.approval.deleteMany({
          where: {
            itemId: project.id,
            itemType: ApprovalItemType.PROJECT,
            action: ApprovalAction.DELETE,
            status: ApprovalStatus.PENDING
          }
        })
      )
    }

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
}
