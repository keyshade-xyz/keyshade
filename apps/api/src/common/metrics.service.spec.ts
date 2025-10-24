import { Test, TestingModule } from '@nestjs/testing'
import { MetricService } from './metrics.service'
import { Logger } from '@nestjs/common'

describe('MetricService', () => {
  let service: MetricService
  let loggerSpy: jest.SpyInstance

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricService]
    }).compile()

    service = module.get<MetricService>(MetricService)
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation()
  })

  afterEach(() => {
    loggerSpy.mockRestore()
  })

  describe('incrementSecretPull', () => {
    it('should call incrementMetric with correct parameters', async () => {
      const incrementMetricSpy = jest
        .spyOn(service, 'incrementMetric')
        .mockResolvedValue()

      await service.incrementSecretPull(5)

      expect(incrementMetricSpy).toHaveBeenCalledWith('totalSecretPulls', 5)
    })

    it('should handle single secret pull', async () => {
      const incrementMetricSpy = jest
        .spyOn(service, 'incrementMetric')
        .mockResolvedValue()

      await service.incrementSecretPull(1)

      expect(incrementMetricSpy).toHaveBeenCalledWith('totalSecretPulls', 1)
    })
  })

  describe('incrementVariablePull', () => {
    it('should call incrementMetric with correct parameters', async () => {
      const incrementMetricSpy = jest
        .spyOn(service, 'incrementMetric')
        .mockResolvedValue()

      await service.incrementVariablePull(3)

      expect(incrementMetricSpy).toHaveBeenCalledWith('totalVariablePulls', 3)
    })
  })

  describe('incrementRunCommandExecution', () => {
    it('should call incrementMetric with correct parameters', async () => {
      const incrementMetricSpy = jest
        .spyOn(service, 'incrementMetric')
        .mockResolvedValue()

      await service.incrementRunCommandExecution(1)

      expect(incrementMetricSpy).toHaveBeenCalledWith(
        'totalRunCommandExecutions',
        1
      )
    })
  })

  describe('incrementMetric', () => {
    it('should log the increment operation', async () => {
      await service.incrementMetric('testKey', 10)

      expect(loggerSpy).toHaveBeenCalledWith(
        'Incrementing metric testKey by 10'
      )
    })
  })
})
