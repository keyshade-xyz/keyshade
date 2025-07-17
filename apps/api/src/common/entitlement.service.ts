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
      canDelete: permittedAuthorities.has(Authority.DELETE_ENVIRONMENT),
      canUpdate: permittedAuthorities.has(Authority.UPDATE_ENVIRONMENT)
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
}
