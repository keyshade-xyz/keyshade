import { VercelIntegration } from './vercel.integration'
import { encryptMetadata } from '@/common/util'
import { EventType } from '@prisma/client'
// Provide a deterministic server secret for sEncrypt/sDecrypt helpers used by encryptMetadata
process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-server-secret'

describe('VercelIntegration - environment handlers', () => {
  it('should delete project env vars and disconnect environment on ENVIRONMENT_DELETED', async () => {
    const mockPrisma: any = {
      integrationRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn()
      },
      integration: {
        update: jest.fn().mockResolvedValue({})
      },
      event: {
        create: jest.fn().mockResolvedValue({})
      }
    }

    const metadata = {
      projectId: 'proj-1',
      token: 'token-1',
      environments: {
        development: { vercelSystemEnvironment: 'development' }
      }
    }

    const integration = {
      id: 'int-1',
      metadata: encryptMetadata(metadata as any),
      environments: [{ id: 'env-1', slug: 'development' }]
    }

    const instance = new VercelIntegration(mockPrisma)
    instance.setIntegration(integration as any)

    const mockVercel: any = {
      projects: {
        filterProjectEnvs: jest.fn().mockResolvedValue({ envs: [ { id: 'env-var-id', key: 'VAR1', target: ['development'], customEnvironmentIds: [] } ] }),
        removeProjectEnv: jest.fn().mockResolvedValue({})
      },
      environment: { updateCustomEnvironment: jest.fn() }
    }

    // Inject mock client
    // @ts-ignore
    instance.vercel = mockVercel

    await instance.emitEvent({ event: { id: 'evt-1', itemId: 'env-1', metadata: '{}' }, eventType: EventType.ENVIRONMENT_DELETED } as any)

    expect(mockVercel.projects.filterProjectEnvs).toHaveBeenCalled()
    expect(mockVercel.projects.removeProjectEnv).toHaveBeenCalled()
    expect(mockPrisma.integration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'int-1' },
        data: expect.objectContaining({ environments: { disconnect: { id: 'env-1' } } })
      })
    )
  })

  it('should attempt to rename custom environment on ENVIRONMENT_UPDATED', async () => {
    const mockPrisma: any = {
      integrationRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn()
      },
      integration: {
        update: jest.fn().mockResolvedValue({})
      },
      event: {
        create: jest.fn().mockResolvedValue({})
      }
    }

    const metadata = {
      projectId: 'proj-1',
      token: 'token-1',
      environments: {
        development: { vercelCustomEnvironmentId: 'custom-1' }
      }
    }

    const integration = {
      id: 'int-1',
      metadata: encryptMetadata(metadata as any),
      environments: [{ id: 'env-1', slug: 'development' }]
    }

    const instance = new VercelIntegration(mockPrisma)
    instance.setIntegration(integration as any)

    const mockVercel: any = {
      projects: {
        filterProjectEnvs: jest.fn().mockResolvedValue({ envs: [] }),
        removeProjectEnv: jest.fn().mockResolvedValue({})
      },
      environment: { updateCustomEnvironment: jest.fn().mockResolvedValue({}) }
    }

    // Inject mock client
    // @ts-ignore
    instance.vercel = mockVercel

    const eventMeta = encryptMetadata({ name: 'new-dev-name' } as any)

    await instance.emitEvent({ event: { id: 'evt-2', itemId: 'env-1', metadata: eventMeta }, eventType: EventType.ENVIRONMENT_UPDATED } as any)

    expect(mockVercel.environment.updateCustomEnvironment).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrName: 'proj-1',
        environmentSlugOrId: 'custom-1',
        requestBody: expect.objectContaining({ slug: 'new-dev-name' })
      })
    )

    // verify audit event persisted
    expect(mockPrisma.event.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: expect.any(String),
        itemId: 'env-1'
      })
    }))
  })
})
