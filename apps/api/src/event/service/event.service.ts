import { BadRequestException, Injectable } from '@nestjs/common'
import { Authority, EventSeverity, User } from '@prisma/client'
import getWorkspaceWithAuthority from '../../common/get-workspace-with-authority'
import getProjectWithAuthority from '../../common/get-project-with-authority'
import getEnvironmentWithAuthority from '../../common/get-environment-with-authority'
import getSecretWithAuthority from '../../common/get-secret-with-authority'
import { PrismaService } from '../../prisma/prisma.service'
import getVariableWithAuthority from '../../common/get-variable-with-authority'

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents(
    user: User,
    context: {
      workspaceId?: string
      projectId?: string
      environmentId?: string
      secretId?: string
      variableId?: string
      apiKeyId?: string
      workspaceRoleId?: string
    },
    page: number,
    limit: number,
    search: string,
    severity?: EventSeverity
  ) {
    if (severity && !Object.values(EventSeverity).includes(severity)) {
      throw new BadRequestException('Invalid "severity" value')
    }

    const whereCondition = {
      severity: severity,
      title: {
        contains: search
      }
    }

    // Set context-specific condition
    if (context.workspaceId) {
      await getWorkspaceWithAuthority(
        user.id,
        context.workspaceId,
        Authority.READ_WORKSPACE,
        this.prisma
      )
      whereCondition['sourceWorkspaceId'] = context.workspaceId
    } else if (context.projectId) {
      await getProjectWithAuthority(
        user.id,
        context.projectId,
        Authority.READ_PROJECT,
        this.prisma
      )
      whereCondition['sourceProjectId'] = context.projectId
    } else if (context.environmentId) {
      await getEnvironmentWithAuthority(
        user.id,
        context.environmentId,
        Authority.READ_ENVIRONMENT,
        this.prisma
      )
      whereCondition['sourceEnvironmentId'] = context.environmentId
    } else if (context.secretId) {
      await getSecretWithAuthority(
        user.id,
        context.secretId,
        Authority.READ_SECRET,
        this.prisma
      )
      whereCondition['sourceSecretId'] = context.secretId
    } else if (context.variableId) {
      await getVariableWithAuthority(
        user.id,
        context.variableId,
        Authority.READ_VARIABLE,
        this.prisma
      )
      whereCondition['sourceVariableId'] = context.variableId
    } else if (context.apiKeyId) {
      whereCondition['sourceApiKeyId'] = context.apiKeyId
    } else if (context.workspaceRoleId) {
      const workspaceRole = await this.prisma.workspaceRole.findUnique({
        where: {
          id: context.workspaceRoleId
        },
        include: {
          workspace: true
        }
      })
      await getWorkspaceWithAuthority(
        user.id,
        workspaceRole.workspace.id,
        Authority.READ_WORKSPACE_ROLE,
        this.prisma
      )
      whereCondition['sourceWorkspaceRoleId'] = context.workspaceRoleId
    } else {
      whereCondition['sourceUserId'] = user.id
    }

    // Get the events
    return await this.prisma.event.findMany({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        timestamp: true,
        source: true,
        triggerer: true,
        type: true,
        metadata: true
      }
    })
  }
}
