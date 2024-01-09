import { Project, ProjectMember, ProjectRole, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { IProjectRepository } from './interface.repository'
import { Injectable } from '@nestjs/common'
import { ProjectMembership, ProjectWithUserRole } from '../project.types'

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addMemberToProject(
    projectId: Project['id'],
    userId: User['id'],
    role: ProjectRole
  ): Promise<ProjectMember> {
    return await this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role
      }
    })
  }

  async removeMemberFromProject(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<void> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })
  }

  async updateMembership(
    projectId: Project['id'],
    userId: User['id'],
    data: Partial<Pick<ProjectMember, 'role' | 'invitationAccepted'>>
  ): Promise<ProjectMember> {
    return await this.prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      data: {
        role: data.role,
        invitationAccepted: data.invitationAccepted
      }
    })
  }

  async memberExistsInProject(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    return await this.prisma.projectMember
      .count({
        where: {
          projectId,
          userId
        }
      })
      .then((count) => count > 0)
  }

  async invitationPending(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean> {
    return await this.prisma.projectMember
      .count({
        where: {
          projectId,
          userId,
          invitationAccepted: false
        }
      })
      .then((count) => count > 0)
  }

  async deleteMembership(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<void> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })
  }

  async projectExists(
    projectName: string,
    userId: User['id']
  ): Promise<boolean> {
    return this.prisma.projectMember
      .count({
        where: {
          user: {
            id: userId
          },
          project: {
            name: projectName
          }
        }
      })
      .then((count) => count > 0)
  }

  async createProject(project: Partial<Project>, userId: User['id']) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        subscription: true
      }
    })

    return await this.prisma.project.create({
      data: {
        name: project.name,
        description: project.description,
        publicKey: project.publicKey,
        privateKey: project.privateKey,
        storePrivateKey: project.storePrivateKey,
        lastUpdatedById: userId,
        members: {
          create: {
            userId: userId,
            role: ProjectRole.OWNER,
            invitationAccepted: true
          }
        },
        isFreeTier:
          user.subscription === null || user.subscription.isActive === false
      }
    })
  }

  async updateProject(
    projectId: Project['id'],
    project: Partial<Project>,
    userId: User['id']
  ) {
    return await this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        ...project,
        lastUpdatedById: userId
      }
    })
  }

  async deleteProject(projectId: Project['id']): Promise<void> {
    await this.prisma.project.delete({
      where: {
        id: projectId
      }
    })
    return Promise.resolve()
  }

  async getProjectByUserIdAndId(userId: User['id'], projectId: Project['id']) {
    return await this.prisma.project.findUnique({
      where: {
        id: projectId,
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        secrets: {
          include: {
            versions: {
              orderBy: {
                version: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })
  }

  async getProjectById(projectId: Project['id']) {
    return await this.prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        members: {
          select: {
            user: true,
            invitationAccepted: true,
            role: true
          }
        },
        secrets: {
          include: {
            versions: {
              orderBy: {
                version: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })
  }

  async getProjectsOfUser(
    userId: User['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Array<ProjectWithUserRole>> {
    const memberships = await this.prisma.projectMember.findMany({
      skip: (page - 1) * limit,
      orderBy: {
        project: {
          [sort]: order
        }
      },
      include: {
        project: true
      },
      take: limit,
      where: {
        userId: userId,
        project: {
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
        }
      }
    })

    return memberships.map((membership) => ({
      ...membership.project,
      role: membership.role
    }))
  }

  async getProjects(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Project[]> {
    return await this.prisma.project.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      where: {
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
      }
    })
  }

  async getProjectMembershipsOfUser(userId: User['id']) {
    return await this.prisma.projectMember.findMany({
      where: {
        userId: userId
      }
    })
  }

  async getMembersOfProject(
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<ProjectMembership[]> {
    return await this.prisma.projectMember.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        project: {
          [sort]: order
        }
      },
      where: {
        projectId: projectId,
        user: {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              email: {
                contains: search
              }
            }
          ]
        }
      },
      include: {
        user: true
      }
    })
  }
}
