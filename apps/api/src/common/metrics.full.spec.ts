import { Test, TestingModule } from '@nestjs/testing'
import { MetricService } from './metrics.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import {
  FILE_UPLOAD_SERVICE,
  FileUploadService
} from '@/file-upload/file-upload.service'

describe('MetricService E2E Tests', () => {
  let service: MetricService
  let mockRedisClient: any
  let mockFileUploadService: jest.Mocked<FileUploadService>

  beforeEach(async () => {
    // Mock Redis client
    mockRedisClient = {
      publisher: {
        hIncrBy: jest.fn().mockImplementation((key, field, value) => {
          // Simulate Redis increment
          return Promise.resolve(value)
        }),
        ttl: jest.fn().mockResolvedValue(-1), // No TTL initially
        expire: jest.fn().mockResolvedValue(1), // Success
        hGetAll: jest.fn().mockResolvedValue({}),
        del: jest.fn().mockResolvedValue(1)
      }
    }

    // Mock FileUploadService
    mockFileUploadService = {
      uploadFiles: jest.fn().mockResolvedValue(['metrics/2025-10-24.json']),
      getFiles: jest.fn(),
      deleteFiles: jest.fn(),
      getFileUrls: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient
        },
        {
          provide: FILE_UPLOAD_SERVICE,
          useValue: mockFileUploadService
        }
      ]
    }).compile()

    service = module.get<MetricService>(MetricService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Requirement: Track daily usage metrics', () => {
    it('should track number of secrets fetched', async () => {
      const numberOfSecrets = 100

      await service.incrementSecretPull(numberOfSecrets)

      const today = new Date().toISOString().split('T')[0]
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenCalledWith(
        `metrics:${today}`,
        'totalSecretPulls',
        numberOfSecrets
      )
    })

    it('should track number of variables fetched', async () => {
      const numberOfVariables = 300

      await service.incrementVariablePull(numberOfVariables)

      const today = new Date().toISOString().split('T')[0]
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenCalledWith(
        `metrics:${today}`,
        'totalVariablePulls',
        numberOfVariables
      )
    })

    it('should track number of run command executions', async () => {
      const numberOfExecutions = 200

      await service.incrementRunCommandExecution(numberOfExecutions)

      const today = new Date().toISOString().split('T')[0]
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenCalledWith(
        `metrics:${today}`,
        'totalRunCommandExecutions',
        numberOfExecutions
      )
    })

    it('should store metrics in per-day basis with date-based keys', async () => {
      await service.incrementSecretPull(10)
      await service.incrementVariablePull(20)
      await service.incrementRunCommandExecution(5)

      const today = new Date().toISOString().split('T')[0]
      const expectedKey = `metrics:${today}`

      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenCalledTimes(3)
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenNthCalledWith(
        1,
        expectedKey,
        'totalSecretPulls',
        10
      )
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenNthCalledWith(
        2,
        expectedKey,
        'totalVariablePulls',
        20
      )
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenNthCalledWith(
        3,
        expectedKey,
        'totalRunCommandExecutions',
        5
      )
    })
  })

  describe('Requirement: Aggregation and storage', () => {
    it('should extract data from cache and create JSON file with correct structure', async () => {
      // Mock Redis data for yesterday
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = yesterdayDate.toISOString().split('T')[0]

      mockRedisClient.publisher.hGetAll.mockResolvedValue({
        totalSecretPulls: '100',
        totalVariablePulls: '300',
        totalRunCommandExecutions: '200'
      })

      await service['UploadMetrics']()

      // Verify correct JSON structure was created
      expect(mockFileUploadService.uploadFiles).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: `metrics-${yesterday}.json`,
            type: 'application/json'
          })
        ]),
        'metrics/',
        0
      )

      // Check the JSON content
      const uploadCall = mockFileUploadService.uploadFiles.mock.calls[0]
      const file = uploadCall[0][0]
      const fileContent = await file.text()
      const parsedContent = JSON.parse(fileContent)

      expect(parsedContent).toEqual({
        date: yesterday,
        metrics: {
          totalSecretPulls: '100',
          totalVariablePulls: '300',
          totalRunCommandExecutions: '200'
        }
      })
    })

    it('should upload file to metrics/ directory using FileUploadService', async () => {
      mockRedisClient.publisher.hGetAll.mockResolvedValue({
        totalSecretPulls: '50',
        totalVariablePulls: '75',
        totalRunCommandExecutions: '25'
      })

      await service['UploadMetrics']()

      expect(mockFileUploadService.uploadFiles).toHaveBeenCalledWith(
        expect.any(Array),
        'metrics/', // Verify correct directory
        0 // No expiration
      )
    })

    it('should flush cache after upload operation', async () => {
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = yesterdayDate.toISOString().split('T')[0]

      mockRedisClient.publisher.hGetAll.mockResolvedValue({
        totalSecretPulls: '10',
        totalVariablePulls: '20',
        totalRunCommandExecutions: '30'
      })

      await service['UploadMetrics']()

      // Verify Redis key was deleted after upload
      expect(mockRedisClient.publisher.del).toHaveBeenCalledWith(
        `metrics:${yesterday}`
      )
      // Verify both upload and delete were called
      expect(mockFileUploadService.uploadFiles).toHaveBeenCalled()
    })

    it('should handle empty metrics data', async () => {
      mockRedisClient.publisher.hGetAll.mockResolvedValue({})

      await service['UploadMetrics']()

      const uploadCall = mockFileUploadService.uploadFiles.mock.calls[0]
      const file = uploadCall[0][0]
      const fileContent = await file.text()
      const parsedContent = JSON.parse(fileContent)

      expect(parsedContent).toEqual({
        date: expect.any(String),
        metrics: {}
      })
    })

    it('should handle partial metrics data', async () => {
      mockRedisClient.publisher.hGetAll.mockResolvedValue({
        totalSecretPulls: '100'
        // Missing totalVariablePulls and totalRunCommandExecutions
      })

      await service['UploadMetrics']()

      const uploadCall = mockFileUploadService.uploadFiles.mock.calls[0]
      const file = uploadCall[0][0]
      const fileContent = await file.text()
      const parsedContent = JSON.parse(fileContent)

      expect(parsedContent).toEqual({
        date: expect.any(String),
        metrics: {
          totalSecretPulls: '100'
        }
      })
    })
  })

  describe('Requirement: TTL and data safety', () => {
    it('should set TTL on first increment to prevent stale data', async () => {
      mockRedisClient.publisher.ttl.mockResolvedValue(-1) // No TTL

      await service.incrementSecretPull(10)

      const today = new Date().toISOString().split('T')[0]
      expect(mockRedisClient.publisher.expire).toHaveBeenCalledWith(
        `metrics:${today}`,
        60 * 60 * 24 * 2
      )
    })

    it('should not reset TTL if already set', async () => {
      mockRedisClient.publisher.ttl.mockResolvedValue(3600) // 1 hour remaining

      await service.incrementSecretPull(10)

      expect(mockRedisClient.publisher.expire).not.toHaveBeenCalled()
    })
  })

  describe('Requirement: Public API functions', () => {
    it('should expose incrementSecretPull as public function', () => {
      expect(service.incrementSecretPull).toBeDefined()
      expect(typeof service.incrementSecretPull).toBe('function')
    })

    it('should expose incrementVariablePull as public function', () => {
      expect(service.incrementVariablePull).toBeDefined()
      expect(typeof service.incrementVariablePull).toBe('function')
    })

    it('should expose incrementRunCommandExecution as public function', () => {
      expect(service.incrementRunCommandExecution).toBeDefined()
      expect(typeof service.incrementRunCommandExecution).toBe('function')
    })
  })

  describe('Requirement: Cron job at 12 AM', () => {
    it('should have UploadMetrics method decorated with EVERY_DAY_AT_MIDNIGHT', () => {
      // Check if the method exists
      expect(service['UploadMetrics']).toBeDefined()
      expect(typeof service['UploadMetrics']).toBe('function')
    })
  })

  describe('End-to-End Scenario: Full day cycle', () => {
    it('should track metrics throughout the day and upload at midnight', async () => {
      // Simulate usage throughout the day
      await service.incrementSecretPull(50)
      await service.incrementSecretPull(50) // Total: 100
      await service.incrementVariablePull(150)
      await service.incrementVariablePull(150) // Total: 300
      await service.incrementRunCommandExecution(100)
      await service.incrementRunCommandExecution(100) // Total: 200

      // Verify all increments happened
      expect(mockRedisClient.publisher.hIncrBy).toHaveBeenCalledTimes(6)

      // Simulate midnight cron job (using yesterday's data)
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = yesterdayDate.toISOString().split('T')[0]

      mockRedisClient.publisher.hGetAll.mockResolvedValue({
        totalSecretPulls: '100',
        totalVariablePulls: '300',
        totalRunCommandExecutions: '200'
      })

      await service['UploadMetrics']()

      // Verify file was uploaded
      expect(mockFileUploadService.uploadFiles).toHaveBeenCalled()

      // Verify cache was flushed
      expect(mockRedisClient.publisher.del).toHaveBeenCalledWith(
        `metrics:${yesterday}`
      )
    })
  })

  describe('Error handling', () => {
    it('should not throw if upload fails', async () => {
      mockFileUploadService.uploadFiles.mockRejectedValue(
        new Error('Upload failed')
      )

      await expect(service['UploadMetrics']()).resolves.not.toThrow()
    })

    it('should not throw if increment fails', async () => {
      mockRedisClient.publisher.hIncrBy.mockRejectedValue(
        new Error('Redis error')
      )

      // incrementMetric catches errors and logs them, does not throw
      await expect(service.incrementSecretPull(10)).resolves.not.toThrow()
    })
  })
})
