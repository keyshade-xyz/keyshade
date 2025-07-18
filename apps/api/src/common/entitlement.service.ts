import {
  HydratedIntegration,
  RawIntegration
} from '@/integration/integration.types'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthenticatedUser } from '@/user/user.types'
import { Injectable, Logger } from '@nestjs/common'
import { Authority, Project, Workspace } from '@prisma/client'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from './collective-authorities'
import { RawEntitledSecret, RawSecret } from '@/secret/secret.types'
import { RawEntitledVariable, RawVariable } from '@/variable/variable.types'
import {
  HydratedEnvironment,
  RawEnvironment
} from '@/environment/environment.types'
import {
  HydratedWorkspaceRole,
  RawWorkspaceRole
} from '@/workspace-role/workspace-role.types'

type RootEntitlementParams = {
  user: AuthenticatedUser
  permittedAuthorities?: Set<Authority>
}

type IntegrationEntitlementParams = RootEntitlementParams & {
  workspaceId: Workspace['id']
  integration: RawIntegration
}

type SecretEntitlementParams = RootEntitlementParams & {
  project: Partial<Project>
  secret: RawSecret
}

type VariableEntitlementParams = RootEntitlementParams & {
  project: Partial<Project>
  variable: RawVariable
}

type EnvironmentEntitlementParams = RootEntitlementParams & {
  environment: RawEnvironment
}

type WorkspaceRoleEntitlementParams = RootEntitlementParams & {
  workspaceRole: RawWorkspaceRole
}

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name)

  constructor(private readonly prisma: PrismaService) {}

  public async entitleIntegration({
    workspaceId,
    user,
    permittedAuthorities,
    integration
  }: IntegrationEntitlementParams): Promise<HydratedIntegration> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        workspaceId,
        user.id,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with integration ${integration.slug} for user ${user.id}`
    )

    const entitlements = {
      canDelete: this.isPermitted(
        Authority.DELETE_INTEGRATION,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_INTEGRATION,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with integration ${integration.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...integration,
      entitlements
    }
  }

  public async entitleSecret({
    project,
    user,
    permittedAuthorities,
    secret
  }: SecretEntitlementParams): Promise<RawEntitledSecret> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        project,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with secret ${secret.slug} for user ${user.id}`
    )

    const entitlements = {
      canDelete: this.isPermitted(
        Authority.DELETE_SECRET,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(Authority.UPDATE_SECRET, permittedAuthorities)
    }

    this.logger.log(
      `Associated entitlements with secret ${secret.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...secret,
      entitlements
    }
  }

  public async entitleVariable({
    project,
    user,
    permittedAuthorities,
    variable
  }: VariableEntitlementParams): Promise<RawEntitledVariable> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        project,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with variable ${variable.slug} for user ${user.id}`
    )

    const entitlements = {
      canDelete: this.isPermitted(
        Authority.DELETE_VARIABLE,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_VARIABLE,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with variable ${variable.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...variable,
      entitlements
    }
  }

  public async entitleEnvironment({
    environment,
    user,
    permittedAuthorities
  }: EnvironmentEntitlementParams): Promise<HydratedEnvironment> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveEnvironmentAuthorities(
        user.id,
        environment,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with environment ${environment.slug} for user ${user.id}`
    )

    const entitlements = {
      canDelete: this.isPermitted(
        Authority.DELETE_ENVIRONMENT,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_ENVIRONMENT,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with environment ${environment.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...environment,
      entitlements
    }
  }

  public async entitleWorkspaceRole({
    workspaceRole,
    user,
    permittedAuthorities
  }: WorkspaceRoleEntitlementParams): Promise<HydratedWorkspaceRole> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        workspaceRole.workspaceId,
        user.id,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with workspace role ${workspaceRole.slug} for user ${user.id}`
    )

    const entitlements = {
      canDelete: this.isPermitted(
        Authority.DELETE_WORKSPACE_ROLE,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_WORKSPACE_ROLE,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with workspace role ${workspaceRole.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...workspaceRole,
      entitlements
    }
  }

  /**
   * Checks if the given authority is present in the set of permitted authorities.
   *
   * @param authority The authority to check for permission.
   * @param permittedAuthorities The set of authorities that are permitted.
   * @returns true if the authority is included in the permitted authorities or if
   * the WORKSPACE_ADMIN authority is present; false otherwise.
   */
  private isPermitted(
    authority: Authority,
    permittedAuthorities: Set<Authority>
  ) {
    return (
      permittedAuthorities.has(authority) ||
      permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )
  }
}
