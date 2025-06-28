import { IntegrationType } from '@prisma/client'
import { BaseIntegration } from './base.integration'
import { DiscordIntegration } from './discord.integration'
import { InternalServerErrorException } from '@nestjs/common'
import { SlackIntegration } from './slack.integration'
import { PrismaService } from '@/prisma/prisma.service'
import {
  DiscordIntegrationMetadata,
  IntegrationWithEnvironments,
  SlackIntegrationMetadata,
  VercelIntegrationMetadata
} from '../integration.types'
import { VercelIntegration } from './vercel.integration'
/**
 * Factory class to create integrations. This class will be called to create an integration,
 * based on the integration type. This has only a single factory method. You will need to
 * add your plugin to the switch case in the createIntegration method.
 */
export default class IntegrationFactory {
  /**
   * Create an integration based on the integration type.
   * @param integrationType The type of integration to create.
   * @returns The integration object.
   */
  public static createIntegrationWithType(
    integrationType: IntegrationType,
    prisma: PrismaService
  ): BaseIntegration {
    switch (integrationType) {
      case IntegrationType.DISCORD:
        return new DiscordIntegration(prisma)
      case IntegrationType.SLACK:
        return new SlackIntegration(prisma)
      case IntegrationType.VERCEL:
        return new VercelIntegration(prisma)
      default:
        throw new InternalServerErrorException('Integration type not found')
    }
  }

  /**
   * Creates an integration object based on the integration type and the integration
   * itself. This method is used to create an integration object from a database
   * integration entity.
   * @param integration The integration entity from the database.
   * @param prisma The prisma service.
   * @returns The integration object.
   */
  public static createIntegration(
    integration: IntegrationWithEnvironments,
    prisma: PrismaService
  ): BaseIntegration {
    const baseIntegration = IntegrationFactory.createIntegrationWithType(
      integration.type,
      prisma
    )

    switch (integration.type) {
      case IntegrationType.DISCORD:
        baseIntegration.setIntegration<DiscordIntegrationMetadata>(integration)
        break
      case IntegrationType.SLACK:
        baseIntegration.setIntegration<SlackIntegrationMetadata>(integration)
        break
      case IntegrationType.VERCEL:
        baseIntegration.setIntegration<VercelIntegrationMetadata>(integration)
        break
      default:
        throw new InternalServerErrorException('Integration type not found')
    }

    return baseIntegration
  }
}
