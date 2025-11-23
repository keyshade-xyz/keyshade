import { processPendingCleanups } from '@/integration/reconciler'
import { encryptMetadata, decryptMetadata } from '@/common/util'

// Mock IntegrationFactory module used by reconciler
jest.mock('@/integration/plugins/integration.factory', () => ({
  __esModule: true,
  default: {
    createIntegration: jest.fn(() => ({
      emitEvent: jest.fn().mockResolvedValue(undefined)
    }))
  }
}))

process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-server-secret'

describe('Reconciler', () => {
  it('should process pendingCleanup entry and remove it on success', async () => {
    const pending = [{ environmentId: 'env-1', action: 'ENVIRONMENT_DELETED' }]
    const integration = {
      id: 'int-1',
      metadata: encryptMetadata({ pendingCleanup: pending } as any),
      type: 'VERCEL'
    }

    const mockPrisma: any = {
      integration: {
        findMany: jest.fn().mockResolvedValue([integration]),
        update: jest.fn().mockResolvedValue({})
      }
    }

    await processPendingCleanups(mockPrisma as any)

    // Ensure update was called to persist metadata without pendingCleanup
    expect(mockPrisma.integration.update).toHaveBeenCalled()

    const callArg = mockPrisma.integration.update.mock.calls[0][0]
    const persistedEncrypted = callArg.data.metadata
    const persisted = decryptMetadata<any>(persistedEncrypted)
    // pendingCleanup should be removed or be an empty array
    if (Array.isArray(persisted.pendingCleanup)) {
      expect(persisted.pendingCleanup.length).toBe(0)
    } else {
      expect(persisted.pendingCleanup).toBeUndefined()
    }
  })
})
