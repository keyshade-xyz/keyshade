import { PrismaService } from '@/prisma/prisma.service'
import { BaseIntegration } from './base.integration'
import {
  Event,
  EventType,
  IntegrationRunStatus,
  IntegrationType,
  Project
} from '@prisma/client'
import {
  GetFunctionConfigurationCommand,
  LambdaClient,
  UpdateFunctionConfigurationCommand
} from '@aws-sdk/client-lambda'
import {
  AWSLambdaIntegrationMetadata,
  EnvironmentSupportType,
  IntegrationEventData
} from '../integration.types'
import { decryptMetadata, makeTimedRequest } from '@/common/util'
import { BadRequestException } from '@nestjs/common'
import { decrypt, sDecrypt, sEncrypt } from '@/common/cryptography'
import {
  ConfigurationAddedEventMetadata,
  ConfigurationDeletedEventMetadata,
  ConfigurationUpdatedEventMetadata
} from '@/event/event.types'

export class AWSLambdaIntegration extends BaseIntegration {
  private lambda: LambdaClient = null

  constructor(prisma: PrismaService) {
    super(IntegrationType.AWS_LAMBDA, prisma)
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
    return new Set([
      'lambdaFunctionName',
      'region',
      'accessKeyId',
      'secretAccessKey'
    ])
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

  public environmentSupport(): EnvironmentSupportType {
    return 'single'
  }

  public async init(
    privateKey: Project['privateKey'],
    eventId: Event['id']
  ): Promise<void> {
    this.lambda = this.getLambdaClient()

    this.logger.log('Initializing AWS Lambda integration...')

    const integration = this.getIntegration<AWSLambdaIntegrationMetadata>()

    this.logger.log('Adding project private key to Lambda function...')

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: 'Adding KS_PRIVATE_KEY to Lambda function'
    })

    // Add the project's private key to the Lambda function's environment variables
    try {
      const addPrivateKeyDuration =
        await this.updateLambdaFunctionConfiguration(
          integration.metadata.lambdaFunctionName,
          new Map([['KS_PRIVATE_KEY', sEncrypt(privateKey)]])
        )

      this.logger.log('Added project private key to Lambda function')

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        addPrivateKeyDuration,
        'Added project private key to Lambda function'
      )
    } catch (error) {
      this.logger.error('Failed to add project private key to Lambda function')

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        0,
        JSON.stringify(error)
      )

      throw new BadRequestException(error)
    }
  }

  public async emitEvent(data: IntegrationEventData): Promise<void> {
    switch (data.eventType) {
      case EventType.SECRET_ADDED:
      case EventType.VARIABLE_ADDED:
        await this.delegateConfigurationAddedEvent(data)
        break

      case EventType.SECRET_UPDATED:
      case EventType.VARIABLE_UPDATED:
        await this.delegateConfigurationUpdatedEvent(data)
        break

      case EventType.SECRET_DELETED:
      case EventType.VARIABLE_DELETED:
        await this.delegateConfigurationDeletedEvent(data)
        break

      default:
        this.logger.warn(
          `Event type ${data.eventType} not supported for AWS Lambda integration.`
        )
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
  private async delegateConfigurationAddedEvent(data: IntegrationEventData) {
    const addEventMetadata = decryptMetadata<ConfigurationAddedEventMetadata>(
      data.event.metadata
    )

    await this.addEnvironmentalVariable(addEventMetadata, data.event.id)
  }

  /**
   * We have 4 cases in here:
   * 1. The name of a configuration got updated
   * 2. A new version was created for an existing environment
   * 3. A new version was created for a non-existing environment
   * 4. A version was rolled back for an existing environment
   */
  private async delegateConfigurationUpdatedEvent(data: IntegrationEventData) {
    const updateEventMetadata =
      decryptMetadata<ConfigurationUpdatedEventMetadata>(data.event.metadata)

    if (updateEventMetadata.oldName !== updateEventMetadata.newName) {
      // Update the name of the environment
      await this.updateEnvironmentalVariableName(
        updateEventMetadata,
        data.event.id
      )
    }

    // Update the value of the environment
    await this.addEnvironmentalVariable(
      {
        ...updateEventMetadata,
        name: updateEventMetadata.newName
      },
      data.event.id
    )
  }

  private async delegateConfigurationDeletedEvent(data: IntegrationEventData) {
    const deleteEventMetadata =
      decryptMetadata<ConfigurationDeletedEventMetadata>(data.event.metadata)

    await this.deleteEnvironmentalVariable(deleteEventMetadata, data.event.id)
  }

  private async addEnvironmentalVariable(
    data: ConfigurationAddedEventMetadata,
    eventId: Event['id']
  ): Promise<void> {
    if (Object.entries(data.values).length === 0) {
      this.logger.log(
        'No environment variables found while adding configuration. Skipping Lambda API call.'
      )
      return
    }

    this.lambda = this.getLambdaClient()

    const integration = this.getIntegration<AWSLambdaIntegrationMetadata>()
    const metadata = integration.metadata

    const acceptedEnvironmentSlug = integration.environments[0].slug // AWS Lambda only supports a single environment

    // Fetch the value for the accepted environment from event data
    let value = data.values[acceptedEnvironmentSlug]

    if (!value) {
      this.logger.error(
        `No value found for environment ${acceptedEnvironmentSlug}. Skipping Lambda API call.`
      )
      return
    }

    this.logger.log(
      `Found value for environment ${acceptedEnvironmentSlug}. Proceeding to add configuration ${data.name} to Lambda function...`
    )

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Adding ${data.name} to Lambda function`
    })

    let totalDuration: number = 0

    try {
      // Fetch all environmental values from the lambda function
      const {
        existingEnvironmentalValues,
        duration: listEnvironmentVariablesDuration
      } = await this.getAllEnvironmentalValues(metadata.lambdaFunctionName)
      totalDuration += listEnvironmentVariablesDuration

      // Decrypt value if it's encrypted
      if (!data.isPlaintext) {
        this.logger.log(
          'Value is encrypted. Decrypting value before adding to Lambda function...'
        )

        this.logger.log('Fetching KS_PRIVATE_KEY from Lambda function...')
        const privateKey = this.getPrivateKeyFromEnvironmentalValues(
          existingEnvironmentalValues
        )

        if (!privateKey) {
          this.logger.error(
            'Failed to fetch KS_PRIVATE_KEY from Lambda function. Skipping Lambda API call.'
          )
          return
        }

        this.logger.log('Decrypted value...')
        value = await decrypt(privateKey, value)
        this.logger.log('Decrypted value')
      }

      // Update the environmental variable in the Lambda function
      this.logger.log(`Adding ${data.name} to Lambda function`)
      existingEnvironmentalValues.set(data.name, value)
      const updateEnvironmentVariableDuration =
        await this.updateLambdaFunctionConfiguration(
          metadata.lambdaFunctionName,
          existingEnvironmentalValues
        )
      totalDuration += updateEnvironmentVariableDuration
      this.logger.log(`Added ${data.name} to Lambda function`)

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        totalDuration,
        `Added ${data.name} to Lambda function`
      )
    } catch (error) {
      this.logger.error(
        `Failed to add ${data.name} to Lambda function. Error: ${error}`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        totalDuration,
        JSON.stringify(error)
      )
    }
  }

  private async updateEnvironmentalVariableName(
    data: ConfigurationUpdatedEventMetadata,
    eventId: Event['id']
  ): Promise<void> {
    this.lambda = this.getLambdaClient()

    const integration = this.getIntegration<AWSLambdaIntegrationMetadata>()

    this.logger.log(
      `Updating environment variable ${data.oldName} to ${data.newName} in Lambda function...`
    )

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Updating environment variable ${data.oldName} to ${data.newName} in Lambda function`
    })

    let duration: number = 0

    try {
      // Fetch all environmental values from the lambda function
      const {
        existingEnvironmentalValues,
        duration: listEnvironmentVariablesDuration
      } = await this.getAllEnvironmentalValues(
        integration.metadata.lambdaFunctionName
      )
      duration += listEnvironmentVariablesDuration

      // Update the environmental variable in the Lambda function
      this.logger.log(
        `Updating environment variable ${data.oldName} to ${data.newName} in Lambda function...`
      )
      existingEnvironmentalValues.set(
        data.newName,
        existingEnvironmentalValues.get(data.oldName)
      )
      existingEnvironmentalValues.delete(data.oldName)

      const updateEnvironmentVariableDuration =
        await this.updateLambdaFunctionConfiguration(
          integration.metadata.lambdaFunctionName,
          existingEnvironmentalValues
        )
      duration += updateEnvironmentVariableDuration
      this.logger.log(
        `Updated environment variable ${data.oldName} to ${data.newName} in Lambda function`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        duration,
        `Updated environment variable ${data.oldName} to ${data.newName} in Lambda function`
      )
    } catch (error) {
      this.logger.error(
        `Failed to update environment variable ${data.oldName} to ${data.newName} in Lambda function. Error: ${error}`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        duration,
        JSON.stringify(error)
      )
    }
  }

  private async deleteEnvironmentalVariable(
    data: ConfigurationDeletedEventMetadata,
    eventId: Event['id']
  ): Promise<void> {
    this.lambda = this.getLambdaClient()

    const integration = this.getIntegration<AWSLambdaIntegrationMetadata>()
    const metadata = integration.metadata

    this.logger.log(`Attempting to delete environment variable ${data.name}`)

    const acceptedEnvironmentSlug = integration.environments[0].slug
    this.logger.log(
      `Checking if accepted environment ${acceptedEnvironmentSlug} exists in the environment list`
    )
    const exists = data.environments.includes(acceptedEnvironmentSlug)

    if (!exists) {
      this.logger.log(
        `Accepted environment ${acceptedEnvironmentSlug} does not exist in the environment list. Skipping Lambda API call.`
      )
      return
    }

    let duration = 0
    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: `Deleting environment variable ${data.name}`
    })

    try {
      // Fetch all environmental values from the lambda function
      const {
        existingEnvironmentalValues,
        duration: listEnvironmentVariablesDuration
      } = await this.getAllEnvironmentalValues(metadata.lambdaFunctionName)
      duration += listEnvironmentVariablesDuration

      // Update the environmental variable in the Lambda function
      this.logger.log(
        `Deleting environment variable ${data.name} in Lambda function...`
      )
      existingEnvironmentalValues.delete(data.name)

      const updateEnvironmentVariableDuration =
        await this.updateLambdaFunctionConfiguration(
          metadata.lambdaFunctionName,
          existingEnvironmentalValues
        )
      duration += updateEnvironmentVariableDuration
      this.logger.log(
        `Deleted environment variable ${data.name} in Lambda function`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.SUCCESS,
        duration,
        `Deleted environment variable ${data.name} in Lambda function`
      )
    } catch (error) {
      this.logger.error(
        `Failed to delete environment variable ${data.name} in Lambda function. Error: ${error}`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        duration,
        JSON.stringify(error)
      )
    }
  }

  private async getAllEnvironmentalValues(functionName: string): Promise<{
    existingEnvironmentalValues: Map<string, string>
    duration: number
  }> {
    this.lambda = this.getLambdaClient()

    this.logger.log(
      'Fetching all environment variables from Lambda function...'
    )

    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName
    })

    const { response, duration } = await makeTimedRequest(() =>
      this.lambda.send(command)
    )
    const existingEnvironmentalValues = new Map<string, string>(
      Object.entries(response.Environment?.Variables || {})
    )

    console.log('existingEnvironmentalValues', existingEnvironmentalValues)
    console.log(
      'response.Environment?.Variables',
      response.Environment?.Variables
    )

    this.logger.log(
      `Fetched ${existingEnvironmentalValues.size} environment variables from Lambda function`
    )

    return {
      existingEnvironmentalValues,
      duration
    }
  }

  private async updateLambdaFunctionConfiguration(
    functionName: string,
    envVars: Map<string, string>
  ): Promise<number> {
    this.lambda = this.getLambdaClient()

    this.logger.log(
      `Updating Lambda function configuration with ${envVars.size} environment variables...`
    )

    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Environment: {
        Variables: Object.fromEntries(envVars)
      }
    })

    // Add new environment variables
    const { duration } = await makeTimedRequest(() => this.lambda.send(command))

    this.logger.log(`Updated Lambda function configuration in ${duration}ms`)

    return duration
  }

  private getPrivateKeyFromEnvironmentalValues(
    envVars: Map<string, string>
  ): string | null {
    const privateKey = envVars.has('KS_PRIVATE_KEY')
      ? sDecrypt(envVars.get('KS_PRIVATE_KEY'))
      : null
    if (!privateKey) {
      this.logger.error('Project private key not found in Lambda function')
    } else {
      this.logger.log('Fetched project private key from Lambda function')
    }

    return privateKey
  }

  private getLambdaClient(): LambdaClient {
    if (!this.lambda) {
      this.logger.log('Generating AWS Lambda client...')
      const integration = this.getIntegration<AWSLambdaIntegrationMetadata>()
      this.lambda = new LambdaClient({
        region: integration.metadata.region,
        credentials: {
          accessKeyId: integration.metadata.accessKeyId,
          secretAccessKey: integration.metadata.secretAccessKey
        }
      })
      this.logger.log('Generated AWS Lambda client')
    }

    return this.lambda
  }

  public async validateConfiguration(metadata: AWSLambdaIntegrationMetadata) {}
}
