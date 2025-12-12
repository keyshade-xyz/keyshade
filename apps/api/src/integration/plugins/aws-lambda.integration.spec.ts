import { AWSLambdaIntegration } from './aws-lambda.integration'
import { encryptMetadata } from '@/common/util'
// Provide a deterministic server secret for sEncrypt/sDecrypt helpers used by encryptMetadata
process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-server-secret'
import { EventType } from '@prisma/client'
import {
  GetFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommand
} from '@aws-sdk/client-lambda'

describe('AWSLambdaIntegration - environment handlers', () => {
  it('should remove env vars from lambda and disconnect environment on ENVIRONMENT_DELETED', async () => {
    const mockPrisma: any = {
      integrationRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn()
      },
      integration: {
        update: jest.fn().mockResolvedValue({})
      },
      variableVersion: {
        findMany: jest.fn().mockResolvedValue([
          {
            variable: { name: 'VAR1' }
          }
        ])
      },
      secretVersion: {
        findMany: jest.fn().mockResolvedValue([])
      },
      event: {
        create: jest.fn().mockResolvedValue({})
      }
    }

    const integrationMetadata = {
      lambdaFunctionName: 'my-func',
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'SECRET'
    }

    const integration = {
      id: 'int-1',
      metadata: encryptMetadata(integrationMetadata as any),
      environments: [{ id: 'env-1', slug: 'development' }]
    }

    const integrationInstance = new AWSLambdaIntegration(mockPrisma)
    integrationInstance.setIntegration(integration as any)

    // Mock lambda client
    const sendMock = jest.fn(async (command: any) => {
      if (command instanceof GetFunctionConfigurationCommand) {
        return { Environment: { Variables: { VAR1: 'value', KS_PRIVATE_KEY: 'bogus' } } }
      }
      if (command instanceof UpdateFunctionConfigurationCommand) {
        return {}
      }
      return {}
    })

    // Inject mock lambda client
    // @ts-expect-error - Assigning mock object for testing purposes
    integrationInstance.lambda = { send: sendMock }

    await integrationInstance.emitEvent({
      event: { id: 'evt-1', itemId: 'env-1', metadata: '{}' },
      eventType: EventType.ENVIRONMENT_DELETED
    } as any)

    // Expect that update function configuration was called to remove the key
    expect(sendMock).toHaveBeenCalled()
    // Expect that the integration relation was disconnected
    expect(mockPrisma.integration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'int-1' },
        data: expect.objectContaining({ environments: { disconnect: { id: 'env-1' } } })
      })
    )
  })

  it('should be a no-op for ENVIRONMENT_UPDATED on Lambda', async () => {
    const mockPrisma2: any = {
      integrationRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn()
      },
      integration: {
        update: jest.fn().mockResolvedValue({})
      },
      variableVersion: {
        findMany: jest.fn().mockResolvedValue([])
      },
      secretVersion: {
        findMany: jest.fn().mockResolvedValue([])
      },
      event: {
        create: jest.fn().mockResolvedValue({})
      }
    }

    const integrationMetadata = {
      lambdaFunctionName: 'my-func',
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'SECRET'
    }

    const integration2 = {
      id: 'int-1',
      metadata: encryptMetadata(integrationMetadata as any),
      environments: [{ id: 'env-1', slug: 'development' }]
    }

    const instance = new (AWSLambdaIntegration as any)(mockPrisma2)
    instance.setIntegration(integration2 as any)

    const sendMock = jest.fn()
    // @ts-expect-error - Assigning mock object for testing purposes
    instance.lambda = { send: sendMock }

    const eventMeta = encryptMetadata({ name: 'new-name' } as any)

    await instance.emitEvent({ event: { id: 'evt-3', itemId: 'env-1', metadata: eventMeta }, eventType: EventType.ENVIRONMENT_UPDATED } as any)

    // Lambda should not call send for updates (no-op)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
