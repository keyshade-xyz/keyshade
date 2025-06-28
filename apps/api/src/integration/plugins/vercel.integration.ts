import {
  Event,
  EventType,
  IntegrationRunStatus,
  IntegrationType,
  Project
} from '@prisma/client'
import {
  IntegrationEventData,
  VercelIntegrationMetadata
} from '../integration.types'
import { BaseIntegration } from './base.integration'
import { PrismaService } from '@/prisma/prisma.service'
import {
  ConfigurationAddedEventMetadata,
  ConfigurationDeletedEventMetadata,
  ConfigurationUpdatedEventMetadata
} from '@/event/event.types'
import { decryptMetadata, makeTimedRequest } from '@/common/util'
import { InternalServerErrorException } from '@nestjs/common'
import { Vercel } from '@vercel/sdk'
import { decrypt, sDecrypt, sEncrypt } from '@/common/cryptography'

export class VercelIntegration extends BaseIntegration {
  private vercel: Vercel

  constructor(prisma: PrismaService) {
    super(IntegrationType.VERCEL, prisma)
  }

  public getPermittedEvents(): Set<string> {
    return new Set([
      EventType.SECRET_ADDED,
      EventType.SECRET_UPDATED,
      EventType.SECRET_DELETED,
      EventType.VARIABLE_ADDED,
      EventType.VARIABLE_UPDATED,
      EventType.VARIABLE_DELETED
    ])
  }

  public getRequiredMetadataParameters(): Set<string> {
    return new Set(['token', 'projectId', 'environments'])
  }

  public isProjectRequired(): boolean {
    return true
  }

  public areEnvironmentsRequired(): boolean {
    return true
  }

  public isPrivateKeyRequired(): boolean {
    return true
  }

  public async init(
    privateKey: Project['privateKey'],
    eventId: Event['id']
  ): Promise<void> {
    this.vercel = await this.getVercelClient()

    this.logger.log('Initializing Vercel integration...')

    const integration = this.getIntegration<VercelIntegrationMetadata>()

    // Add the project's private key to the Vercel project
    try {
      this.logger.log('Adding project private key to Vercel project...')

      const { id: integrationRunId } = await this.registerIntegrationRun({
        eventId,
        integrationId: integration.id,
        title: 'Adding KS_PRIVATE_KEY to Vercel project'
      })

      // Add new environment variables
      const { response, duration } = await makeTimedRequest(() =>
        this.vercel.projects.createProjectEnv({
          idOrName: integration.metadata.projectId,
          upsert: 'true',
          requestBody: [
            {
              key: 'KS_PRIVATE_KEY',
              comment:
                'Private key of your Keyshade project. Do not delete this.',
              value: sEncrypt(privateKey),
              target: ['production', 'preview', 'development'],
              type: 'plain'
            }
          ]
        })
      )

      this.logger.log('Added KS_PRIVATE_KEY to Vercel project successfully')

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        response.failed.length === 0
          ? IntegrationRunStatus.SUCCESS
          : IntegrationRunStatus.FAILED,
        duration,
        response.failed.map(({ error }) => error.message).join('\n')
      )
    } catch (error) {
      this.logger.error(
        error instanceof Error ? `Error: ${error.message}` : String(error)
      )
      throw new InternalServerErrorException(error)
    }
  }

  public async emitEvent(data: IntegrationEventData): Promise<void> {
    switch (data.eventType) {
      case EventType.SECRET_ADDED:
      case EventType.VARIABLE_ADDED:
        /**
         * We have 3 cases in here:
         * 1. The configuration has no records that were added to it
         * 2. The configuration has only one record
         * 3. The configuration has multiple records.
         *
         * For 1 - we don't make an API call.
         * For 2 and 3, we make an API call.
         */
        const addEventMetadata =
          decryptMetadata<ConfigurationAddedEventMetadata>(data.event.metadata)

        await this.addEnvironmentalVariable(addEventMetadata, data.event.id)
        break

      case EventType.SECRET_UPDATED:
      case EventType.VARIABLE_UPDATED:
        /**
         * We have 4 cases in here:
         * 1. The name of a configuration got updated
         * 2. A new version was created for an existing environment
         * 3. A new version was created for a non-existing environment
         * 4. A version was rolled back for an existing environment
         */

        const updateEventMetadata =
          decryptMetadata<ConfigurationUpdatedEventMetadata>(
            data.event.metadata
          )

        // Update the name of the environment
        await this.updateEnvironmentalVariableNameAndDescription(
          updateEventMetadata,
          data.event.id
        )

        // Update the value of the environment
        await this.addEnvironmentalVariable(
          {
            ...updateEventMetadata,
            name: updateEventMetadata.newName
          },
          data.event.id
        )
        break

      case EventType.SECRET_DELETED:
      case EventType.VARIABLE_DELETED:
        const deleteEventMetadata =
          decryptMetadata<ConfigurationDeletedEventMetadata>(
            data.event.metadata
          )

        await this.deleteEnvironmentalVariable(
          deleteEventMetadata,
          data.event.id
        )
        break
      default:
        this.logger.warn(
          `Event type ${data.eventType} not supported for Vercel integration.`
        )
    }
  }

  /**
   * Handles the logic for adding environment variables to Vercel.
   *
   * This function would be responsible for handling the following scenarios:
   * 1. A configuration is created with a single value
   * 2. A configuration gets created with multiple values
   * 3. A configuration gets a new pair of environment - value
   * 4. A configuration creates a new version for an existing environment
   * 5. A configuration rolls back to a previous version for an existing environment
   * 6. A configuration deletes a single environment value
   * 7. A configuration deletes all environment values (the configuration itself gets deleted)
   *
   * @param data The data from the `ConfigurationAddedEvent`
   * @param eventId The id of the `Event` that triggered this integration.
   */
  private async addEnvironmentalVariable(
    data: ConfigurationAddedEventMetadata,
    eventId: Event['id']
  ): Promise<void> {
    // Only make an API call if there are environment variables
    if (Object.entries(data.values).length === 0) {
      this.logger.log(
        'No environment variables found while adding secret. Skipping Vercel API call.'
      )
      return
    }

    this.vercel = await this.getVercelClient()

    const integration = this.getIntegration<VercelIntegrationMetadata>()
    const metadata = integration.metadata

    this.logger.log(
      `Adding environment variable to Vercel: ${data.name} for ${Object.entries(data.values).length} environment(s)`
    )

    this.logger.log(
      `Filtering out environments that are not part of the integration...`
    )
    const filteredValues = Object.entries(data.values).filter(
      ([environmentName]) => metadata.environments[environmentName]
    )
    this.logger.log(
      `Found ${filteredValues.length} environment(s) that are part of the integration: ${filteredValues.map(([environmentName]) => environmentName).join(', ')}`
    )

    if (filteredValues.length === 0) {
      this.logger.log(
        `No environments found that are part of the integration. Skipping Vercel API call.`
      )
      return
    }

    let totalDuration = 0

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Adding environment variable ${data.name} to targets ${filteredValues.map(([environmentName]) => metadata.environments[environmentName].vercelCustomEnvironmentId || metadata.environments[environmentName].vercelSystemEnvironment).join(', ')}`
    })

    try {
      // If the value is not plaintext, we need to fetch the project's private key from Vercel and decrypt the value
      if (!data.isPlaintext) {
        this.logger.log(
          'Configurations added is encrypted. Fetching KS_API_KEY from Vercel to decrypt the value'
        )

        // Fetch the existing environment variable
        const { duration: listEnvironmentVariablesDuration, envs } =
          await this.getAllEnvironmentVariables(integration.metadata.projectId)
        totalDuration += listEnvironmentVariablesDuration

        let privateKey: string | null
        for (const env of envs) {
          if (env.key === 'KS_PRIVATE_KEY') {
            this.logger.log('Found KS_PRIVATE_KEY. Decrypting values...')
            privateKey = sDecrypt(env.value)

            for (let i = 0; i < filteredValues.length; i++) {
              const [environmentName, value] = filteredValues[i]
              try {
                filteredValues[i] = [
                  environmentName,
                  await decrypt(privateKey, value)
                ]
              } catch (error) {
                this.logger.error(
                  `Failed to decrypt value for environment ${environmentName}: ${error}`
                )
                await this.markIntegrationRunAsFinished(
                  integrationRunId,
                  IntegrationRunStatus.FAILED,
                  totalDuration,
                  `Failed to decrypt value using KS_PRIVATE_KEY.`
                )
                return
              }
            }

            this.logger.log(
              `Successfully decrypted ${filteredValues.length} value(s)`
            )

            break
          }
        }

        if (!privateKey) {
          this.logger.error(
            `Failed to fetch KS_PRIVATE_KEY from Vercel. Skipping Vercel API call.`
          )

          await this.markIntegrationRunAsFinished(
            integrationRunId,
            IntegrationRunStatus.FAILED,
            totalDuration,
            `Failed to fetch KS_PRIVATE_KEY from project ${integration.metadata.projectId}`
          )
          return
        }
      }

      // Add new environment variables
      const { duration, response } = await makeTimedRequest(() =>
        this.vercel.projects.createProjectEnv({
          idOrName: integration.metadata.projectId,
          upsert: 'true',
          requestBody: filteredValues.map(([environmentName, value]) => ({
            key: data.name,
            value,
            comment: data.description ?? undefined,
            target: metadata.environments[environmentName]
              .vercelSystemEnvironment
              ? [metadata.environments[environmentName].vercelSystemEnvironment]
              : undefined,
            customEnvironmentIds: metadata.environments[environmentName]
              .vercelCustomEnvironmentId
              ? [
                  metadata.environments[environmentName]
                    .vercelCustomEnvironmentId
                ]
              : undefined,
            type: data.isSecret ? 'encrypted' : 'plain'
          }))
        })
      )
      totalDuration += duration
      this.logger.log('Added environment variables successfully to Vercel')

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        response.failed.length === 0
          ? IntegrationRunStatus.SUCCESS
          : IntegrationRunStatus.FAILED,
        totalDuration,
        response.failed.map(({ error }) => error.message).join('\n')
      )
    } catch (error) {
      this.logger.error(
        error instanceof Error ? `Error: ${error.message}` : String(error)
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        0,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  private async updateEnvironmentalVariableNameAndDescription(
    data: ConfigurationUpdatedEventMetadata,
    eventId: Event['id']
  ): Promise<void> {
    this.vercel = await this.getVercelClient()

    const integration = this.getIntegration<VercelIntegrationMetadata>()

    this.logger.log(
      `Updating environment variable name from ${data.oldName} to ${data.newName}`
    )

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Updating environment variable name from ${data.oldName} to ${data.newName}`
    })

    try {
      // There can be multiple environment variables on vercel with the same name - for different environments
      const vercelEnvironmentIds: string[] = []

      // Keep track of the total duration
      let totalDuration = 0

      // Fetch the existing environment variable
      const { duration: listEnvironmentVariablesDuration, envs } =
        await this.getAllEnvironmentVariables(integration.metadata.projectId)
      totalDuration += listEnvironmentVariablesDuration
      totalDuration += listEnvironmentVariablesDuration

      envs.forEach((env) => {
        if (env.key === data.oldName) {
          vercelEnvironmentIds.push(env.id)
        }
      })
      this.logger.log(
        `Found ${vercelEnvironmentIds.length} environment variables with the old name in Vercel`
      )

      // Update existing environment variable name
      for (const envId of vercelEnvironmentIds) {
        this.logger.log(`Updating environment variable ${envId} in Vercel...`)
        const { duration: editEnvironmentVariableDuration } =
          await makeTimedRequest(() =>
            this.vercel.projects.editProjectEnv({
              id: envId,
              idOrName: integration.metadata.projectId,
              requestBody: {
                key: data.newName,
                comment: data.description ?? undefined
              }
            })
          )

        totalDuration += editEnvironmentVariableDuration
        this.logger.log(
          `Updated environment variable ${envId} successfully in Vercel`
        )
      }

      this.logger.log(
        'Updated environment variable names successfully in Vercel'
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        totalDuration,
        ''
      )
    } catch (error) {
      this.logger.error(
        error instanceof Error ? `Error: ${error.message}` : String(error)
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        0,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  private async deleteEnvironmentalVariable(
    data: ConfigurationDeletedEventMetadata,
    eventId: Event['id']
  ): Promise<void> {
    this.vercel = await this.getVercelClient()

    const integration = this.getIntegration<VercelIntegrationMetadata>()
    const metadata = integration.metadata

    this.logger.log(
      `Deleting environment variable ${data.name} across ${metadata.environments.length} environments`
    )

    this.logger.log(
      `Filtering out environments that are not part of the integration...`
    )
    const filteredEnvironments = data.environments.filter((environment) =>
      Object.keys(metadata.environments).includes(environment)
    )
    this.logger.log(
      `Found ${filteredEnvironments.length} environment(s) that are part of the integration: ${filteredEnvironments.map(([environmentName]) => environmentName).join(', ')}`
    )

    if (filteredEnvironments.length === 0) {
      this.logger.log(
        `No environment(s) that are part of the integration. Skipping Vercel API call.`
      )
      return
    }

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Deleting environment variable ${data.name}`
    })

    const vercelSystemEnvironmentsSet = new Set()
    const vercelCustomEnvironmentIdsSet = new Set()

    for (const filteredEnvironment of filteredEnvironments) {
      const { vercelCustomEnvironmentId, vercelSystemEnvironment } =
        metadata.environments[filteredEnvironment]
      vercelSystemEnvironmentsSet.add(vercelSystemEnvironment)
      vercelCustomEnvironmentIdsSet.add(vercelCustomEnvironmentId)
    }

    this.logger.log(
      `Would be deleting environment variables of name ${data.name} across system environments ${Array.from(vercelSystemEnvironmentsSet).join(', ')} and custom environments ${Array.from(vercelCustomEnvironmentIdsSet).join(', ')} in Vercel`
    )

    try {
      let totalDuration = 0
      const environmentVariableIds = []

      const { duration: listEnvironmentVariablesDuration, envs } =
        await this.getAllEnvironmentVariables(integration.metadata.projectId)
      totalDuration += listEnvironmentVariablesDuration

      this.logger.log('Filtering environment variables to delete...')
      for (const env of envs) {
        const envName = env.key
        const envTarget = env.target?.[0] // We only create environment value for one target no matter the case
        const envCustomEnvironmentId = env.customEnvironmentIds?.[0]

        if (
          envName === data.name &&
          ((envTarget && vercelSystemEnvironmentsSet.has(envTarget)) ||
            (envCustomEnvironmentId &&
              vercelCustomEnvironmentIdsSet.has(envCustomEnvironmentId)))
        ) {
          environmentVariableIds.push(env.id)
        }
      }
      this.logger.log(
        `Found ${environmentVariableIds.length} environment variable(s) to delete`
      )

      for (const environmentVariableId of environmentVariableIds) {
        this.logger.log(
          `Deleting environment variable ${environmentVariableId} from Vercel`
        )
        const { duration: deleteDuration } = await makeTimedRequest(() =>
          this.vercel.projects.removeProjectEnv({
            id: environmentVariableId,
            idOrName: integration.metadata.projectId
          })
        )
        this.logger.log(
          `Deleted environment variable ${environmentVariableId} from Vercel`
        )

        totalDuration += deleteDuration
      }

      this.logger.log(
        `Deleted environment variable ${data.name} successfully in Vercel`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        totalDuration,
        ''
      )
    } catch (error) {
      this.logger.error(
        error instanceof Error ? `Error: ${error.message}` : String(error)
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        0,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  private async getAllEnvironmentVariables(projectId: string) {
    this.logger.log(`Fetching existing environment variable from Vercel`)
    const { duration, response } = await makeTimedRequest(() =>
      this.vercel.projects.filterProjectEnvs({
        idOrName: projectId
      })
    )
    this.logger.log(
      `Found ${response['envs'].length} environment variables in Vercel`
    )

    return {
      envs: response['envs'],
      duration: duration
    }
  }

  private async getVercelClient(): Promise<Vercel> {
    const { Vercel } = await import('@vercel/sdk')

    if (!this.vercel) {
      this.logger.log('Generating Vercel client...')
      const integration = this.getIntegration<VercelIntegrationMetadata>()
      this.vercel = new Vercel({
        bearerToken: integration.metadata.token
      })
      this.logger.log('Generated Vercel client')
    }

    return this.vercel
  }
}
