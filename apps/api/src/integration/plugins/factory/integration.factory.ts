import { IntegrationType } from '@prisma/client'
import { BaseIntegration } from '../base.integration'
import { DiscordIntegration } from '../discord/discord.integration'
import { InternalServerErrorException } from '@nestjs/common'
import { SlackIntegration } from '../slack/slack.integration'

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
  public static createIntegration(
    integrationType: IntegrationType
  ): BaseIntegration {
    switch (integrationType) {
      case IntegrationType.DISCORD:
        return new DiscordIntegration()
      case IntegrationType.SLACK:
        return new SlackIntegration()
      default:
        throw new InternalServerErrorException('Integration type not found')
    }
  }
}
