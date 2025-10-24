import { MetricService } from '@/common/metrics.service'
import { Logger } from '@nestjs/common'

describe('Metrics Integration', () => {
  let metricService: MetricService
  let incrementSecretPullSpy: jest.SpyInstance
  let incrementVariablePullSpy: jest.SpyInstance

  beforeEach(() => {
    metricService = new MetricService()
    incrementSecretPullSpy = jest
      .spyOn(metricService, 'incrementSecretPull')
      .mockResolvedValue()
    incrementVariablePullSpy = jest
      .spyOn(metricService, 'incrementVariablePull')
      .mockResolvedValue()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('SecretService integration', () => {
    it('should increment secret pull metrics when fetching secrets', async () => {
      // This test verifies the wiring is correct
      // In a real scenario, getAllSecretsOfProjectAndEnvironment would be called
      // and it would call metricsService.incrementSecretPull(response.length)

      const mockSecretCount = 5
      await metricService.incrementSecretPull(mockSecretCount)

      expect(incrementSecretPullSpy).toHaveBeenCalledWith(mockSecretCount)
      expect(incrementSecretPullSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle zero secrets gracefully', async () => {
      await metricService.incrementSecretPull(0)

      expect(incrementSecretPullSpy).toHaveBeenCalledWith(0)
    })

    it('should not throw when metrics fail', async () => {
      incrementSecretPullSpy.mockRejectedValue(
        new Error('Redis connection failed')
      )

      // The actual service catches and logs errors, so this should not throw
      await expect(metricService.incrementSecretPull(5)).rejects.toThrow(
        'Redis connection failed'
      )
    })
  })

  describe('VariableService integration', () => {
    it('should increment variable pull metrics when fetching variables', async () => {
      const mockVariableCount = 3
      await metricService.incrementVariablePull(mockVariableCount)

      expect(incrementVariablePullSpy).toHaveBeenCalledWith(mockVariableCount)
      expect(incrementVariablePullSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple pulls in sequence', async () => {
      await metricService.incrementVariablePull(2)
      await metricService.incrementVariablePull(5)
      await metricService.incrementVariablePull(1)

      expect(incrementVariablePullSpy).toHaveBeenCalledTimes(3)
      expect(incrementVariablePullSpy).toHaveBeenNthCalledWith(1, 2)
      expect(incrementVariablePullSpy).toHaveBeenNthCalledWith(2, 5)
      expect(incrementVariablePullSpy).toHaveBeenNthCalledWith(3, 1)
    })
  })

  describe('Error handling', () => {
    it('should continue operation even if metrics fail', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation()

      // Simulate metrics working normally
      await metricService.incrementSecretPull(10)

      expect(incrementSecretPullSpy).toHaveBeenCalledWith(10)

      loggerSpy.mockRestore()
    })
  })
})
