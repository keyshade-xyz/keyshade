import {
  Event,
  EventType,
  IntegrationRunStatus,
  IntegrationType,
  Project
} from '@prisma/client'
import {
  EnvironmentSupportType,
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
import {
  constructErrorBody,
  decryptMetadata,
  makeTimedRequest
} from '@/common/util'
import { BadRequestException } from '@nestjs/common'
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

  public isPrivateKeyRequired(): boolean {
    return true
  }

  public environmentSupport(): EnvironmentSupportType {
    return 'atleast-one'
  }

  public async init(
    privateKey: Project['privateKey'],
    eventId: Event['id']
  ): Promise<void> {
    this.vercel = await this.getVercelClient()

    this.logger.log('Initializing Vercel integration...')

    const integration = this.getIntegration<VercelIntegrationMetadata>()

    this.logger.log('Adding project private key to Vercel project...')

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: 'Adding KS_PRIVATE_KEY to Vercel project'
    })

    // Add the project's private key to the Vercel project
    try {
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

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        0,
        error instanceof Error ? error.message : String(error)
      )

      throw new BadRequestException(error)
    }
  }

  public async emitEvent(data: IntegrationEventData): Promise<void> {
    let shouldTriggerRedeploy = false

    switch (data.eventType) {
      case EventType.SECRET_ADDED:
      case EventType.VARIABLE_ADDED:
        shouldTriggerRedeploy = await this.delegateConfigurationAddedEvent(data)
        break

      case EventType.SECRET_UPDATED:
      case EventType.VARIABLE_UPDATED:
        shouldTriggerRedeploy =
          await this.delegateConfigurationUpdatedEvent(data)
        break

      case EventType.SECRET_DELETED:
      case EventType.VARIABLE_DELETED:
        shouldTriggerRedeploy =
          await this.delegateConfigurationDeletedEvent(data)
        break

      default:
        this.logger.warn(
          `Event type ${data.eventType} not supported for Vercel integration.`
        )
    }

    if (shouldTriggerRedeploy) {
      await this.triggerRedeploy(data.event.id)
    }
  }

  /**
   * We have 3 cases in here:
   * 1. The configuration has no records that were added to it
   * 2. The configuration has only one record
   * 3. The configuration has multiple records.
   *
   * For 1 - we don't make an API call.
   * For 2 and 3, we make an API call.
   */
  private async delegateConfigurationAddedEvent(
    data: IntegrationEventData
  ): Promise<boolean> {
    const addEventMetadata = decryptMetadata<ConfigurationAddedEventMetadata>(
      data.event.metadata
    )
    return this.addEnvironmentalVariable(addEventMetadata, data.event.id)
  }

  /**
   * We have 4 cases in here:
   * 1. The name of a configuration got updated
   * 2. A new version was created for an existing environment
   * 3. A new version was created for a non-existing environment
   * 4. A version was rolled back for an existing environment
   */
  private async delegateConfigurationUpdatedEvent(
    data: IntegrationEventData
  ): Promise<boolean> {
    const updateEventMetadata =
      decryptMetadata<ConfigurationUpdatedEventMetadata>(data.event.metadata)

    // Update the name of the environment
    const nameUpdated =
      await this.updateEnvironmentalVariableNameAndDescription(
        updateEventMetadata,
        data.event.id
      )

    // Update the value of the environment
    const valueUpdated = await this.addEnvironmentalVariable(
      {
        ...updateEventMetadata,
        name: updateEventMetadata.newName
      },
      data.event.id
    )

    // Trigger redeploy only if at least one Vercel API was called
    return nameUpdated || valueUpdated
  }

  private async delegateConfigurationDeletedEvent(
    data: IntegrationEventData
  ): Promise<boolean> {
    const deleteEventMetadata =
      decryptMetadata<ConfigurationDeletedEventMetadata>(data.event.metadata)

    return await this.deleteEnvironmentalVariable(
      deleteEventMetadata,
      data.event.id
    )
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
  ): Promise<boolean> {
    if (Object.entries(data.values).length === 0) {
      this.logger.log(
        'No environment variables found while adding configuration. Skipping Vercel API call.'
      )
      return false
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
      `Found ${filteredValues.length} environment(s) that are part of the integration: ${filteredValues
        .map(([environmentName]) => environmentName)
        .join(', ')}`
    )

    if (filteredValues.length === 0) {
      this.logger.log(
        `No environments found that are part of the integration. Skipping Vercel API call.`
      )
      return false
    }

    let totalDuration: number = 0

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Adding environment variable ${data.name} to targets ${filteredValues
        .map(
          ([environmentName]) =>
            metadata.environments[environmentName].vercelCustomEnvironmentId ||
            metadata.environments[environmentName].vercelSystemEnvironment
        )
        .join(', ')}`
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
                return false
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
          return true
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
      return true
    } catch (error) {
      this.logger.error(
        error instanceof Error ? `Error: ${error.message}` : String(error)
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        totalDuration,
        error instanceof Error ? error.message : String(error)
      )
      return false
    }
  }

  private async updateEnvironmentalVariableNameAndDescription(
    data: ConfigurationUpdatedEventMetadata,
    eventId: Event['id']
  ): Promise<boolean> {
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

      if (vercelEnvironmentIds.length === 0) {
        await this.markIntegrationRunAsFinished(
          integrationRunId,
          IntegrationRunStatus.SUCCESS,
          totalDuration,
          'No variables found to update'
        )
        return false
      }

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

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        totalDuration,
        ''
      )
      return true
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

      return false
    }
  }

  private async deleteEnvironmentalVariable(
    data: ConfigurationDeletedEventMetadata,
    eventId: Event['id']
  ): Promise<boolean> {
    this.vercel = await this.getVercelClient()

    const integration = this.getIntegration<VercelIntegrationMetadata>()
    const metadata = integration.metadata

    this.logger.log(`Attempting to delete environment variable ${data.name}`)

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
      return false
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

      if (environmentVariableIds.length === 0) {
        await this.markIntegrationRunAsFinished(
          integrationRunId,
          IntegrationRunStatus.SUCCESS,
          totalDuration,
          ''
        )
        return false
      }

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
      return true
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
      return false
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
      duration
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

  public async getVercelEnvironments(
    projectId: string
  ): Promise<VercelIntegrationMetadata['environments']> {
    this.logger.log(
      `Fetching environments from Vercel for project: ${projectId}`
    )

    const environments: VercelIntegrationMetadata['environments'] = {
      development: { vercelSystemEnvironment: 'development' },
      preview: { vercelSystemEnvironment: 'preview' },
      production: { vercelSystemEnvironment: 'production' }
    }

    this.vercel = await this.getVercelClient()

    try {
      const response =
        await this.vercel.environment.getV9ProjectsIdOrNameCustomEnvironments({
          idOrName: projectId
        })

      for (const env of response.environments ?? []) {
        environments[env.slug] = {
          vercelCustomEnvironmentId: env.id
        }
      }
    } catch (err) {
      this.logger.error(`Fetching custom vercel envs failed`, err)
    }

    return {
      environments
    }
  }

  private async triggerRedeploy(eventId: Event['id']): Promise<void> {
    const integration = this.getIntegration<VercelIntegrationMetadata>()
    const projectId: string = integration.metadata.projectId

    this.vercel = await this.getVercelClient()

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Triggering Vercel redeploy for project ${projectId}`
    })

    let duration = 0

    try {
      this.logger.log(`Fetching latest READY deployment for ${projectId}...`)

      const { deployments } = await this.vercel.deployments.getDeployments({
        projectId,
        state: 'READY',
        target: 'production',
        limit: 1
      })

      const latest = deployments?.[0]
      const deploymentId = latest?.uid
      if (!deploymentId) {
        this.logger.warn(`No valid deployment UID found, skipping redeploy.`)

        await this.markIntegrationRunAsFinished(
          integrationRunId,
          IntegrationRunStatus.FAILED,
          duration,
          'No valid deployment UID found for redeployment.'
        )
        return
      }

      const { duration: fetchDuration, response: fullDeployment } =
        await makeTimedRequest(() =>
          this.vercel.deployments.getDeployment({ idOrUrl: deploymentId })
        )
      duration += fetchDuration

      const {
        id,
        name,
        target,
        projectId: deploymentProjectId,
        meta
      } = fullDeployment as {
        id: string
        name: string
        target?: string | null
        projectId: string
        meta?: Record<string, string>
      }

      this.logger.log(`Triggering redeploy from deployment ID: ${id}`)

      const { duration: redeployDuration, response: result } =
        await makeTimedRequest(() =>
          this.vercel.deployments.createDeployment({
            requestBody: {
              deploymentId: id,
              name,
              project: deploymentProjectId,
              target: target ?? 'production',
              meta: meta ?? {},
              withLatestCommit: true
            }
          })
        )
      duration += redeployDuration

      this.logger.log(`Redeployment triggered: ${result.url}`)

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        duration,
        ''
      )
    } catch (err) {
      this.logger.error(`Redeployment failed`, err)

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        duration,
        err instanceof Error ? err.message : String(err)
      )
    }
  }

  public async validateConfiguration(metadata: VercelIntegrationMetadata) {
    this.logger.log(
      `Validating Vercel integration for project ${metadata.projectId}`
    )

    try {
      const { Vercel } = await import('@vercel/sdk')
      const vercel = new Vercel({ bearerToken: metadata.token })

      const { response, duration } = await makeTimedRequest(() =>
        vercel.environment.getV9ProjectsIdOrNameCustomEnvironments({
          idOrName: metadata.projectId
        })
      )

      if (!Array.isArray(response.environments)) {
        throw new Error('Unexpected response format from Vercel API')
      }

      const builtInEnvs = new Set([
        'production',
        'preview',
        'development'
      ] as const)

      const customEnvDefs = response.environments
      const customIds = new Set(customEnvDefs.map((e) => e.id))

      const invalid = Object.entries(metadata.environments).filter(
        ([, { vercelSystemEnvironment, vercelCustomEnvironmentId }]) => {
          if (vercelSystemEnvironment) {
            return !builtInEnvs.has(vercelSystemEnvironment)
          }
          if (vercelCustomEnvironmentId) {
            return !customIds.has(vercelCustomEnvironmentId)
          }
          return true
        }
      )

      if (invalid.length > 0) {
        const badList = invalid
          .map(
            ([
              slug,
              { vercelSystemEnvironment, vercelCustomEnvironmentId }
            ]) => {
              const val = vercelSystemEnvironment ?? vercelCustomEnvironmentId
              return `${slug} (${val})`
            }
          )
          .join(', ')
        throw new Error(
          `The following metadata.environments keys are invalid for project ` +
            `"${metadata.projectId}": ${badList}`
        )
      }

      this.logger.log(
        `Vercel validation succeeded for project "${metadata.projectId}" in ${duration}ms`
      )
    } catch (error) {
      this.logger.error(
        `Vercel configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Vercel validation failed',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }
}
