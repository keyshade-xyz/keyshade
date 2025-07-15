import { HydratedIntegration } from '@/integration/integration.types'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthenticatedUser } from '@/user/user.types'
import { Injectable, Logger } from '@nestjs/common'
import {
  Authority,
  Integration,
  Project,
  Secret,
  Variable,
  Workspace
} from '@prisma/client'
import {
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from './collective-authorities'
import { HydratedSecret } from '@/secret/secret.types'
import { HydratedVariable } from '@/variable/variable.types'

type RootEntitlementParams = {
  user: AuthenticatedUser
  permittedAuthorities?: Set<Authority>
}

type IntegrationEntitlementParams = RootEntitlementParams & {
  workspaceId: Workspace['id']
  integration: Integration
}

type SecretEntitlementParams = RootEntitlementParams & {
  project: Project
  secret: Secret
}

type VariableEntitlementParams = RootEntitlementParams & {
  project: Project
  variable: Variable
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
      canDelete: permittedAuthorities.has(Authority.DELETE_INTEGRATION),
      canUpdate: permittedAuthorities.has(Authority.UPDATE_INTEGRATION)
    }

    this.logger.log(
      `Associated entitlements with integration ${integration.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...integration,
      entitlements
    } as HydratedIntegration
  }

  public async entitleSecret({
    project,
    user,
    permittedAuthorities,
    secret
  }: SecretEntitlementParams): Promise<HydratedSecret> {
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
      canDelete: permittedAuthorities.has(Authority.DELETE_SECRET),
      canUpdate: permittedAuthorities.has(Authority.UPDATE_SECRET)
    }

    this.logger.log(
      `Associated entitlements with secret ${secret.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...secret,
      entitlements
    } as HydratedSecret
  }

  public async entitleVariable({
    project,
    user,
    permittedAuthorities,
    variable
  }: VariableEntitlementParams): Promise<HydratedVariable> {
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
      canDelete: permittedAuthorities.has(Authority.DELETE_VARIABLE),
      canUpdate: permittedAuthorities.has(Authority.UPDATE_VARIABLE)
    }

    this.logger.log(
      `Associated entitlements with variable ${variable.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...variable,
      entitlements
    } as HydratedVariable
  }
}
