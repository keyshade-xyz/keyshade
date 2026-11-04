import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationController } from './integration.controller'
import { IntegrationService } from './integration.service'
import { BaseIntegration } from './plugins/base.integration'
import { IntegrationType } from '@prisma/client'
import { BadRequestException } from '@nestjs/common'
import { encryptMetadata } from '@/common/util'

process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-server-secret'

class MockTestIntegration extends BaseIntegration {
  public validateConfigMock = jest.fn()

  constructor(prisma: any) {
    super(IntegrationType.SLACK, prisma)
  }

  async init(): Promise<void> {}
  async emitEvent(): Promise<void> {}
  getPermittedEvents(): Set<any> {
    return new Set()
  }
  getRequiredMetadataParameters(): Set<string> {
    return new Set(['botToken', 'channelId'])
  }
  async validateConfiguration(metadata: any): Promise<void> {
    return this.validateConfigMock(metadata)
  }
}

describe('Integration Verification (Issue #1012)', () => {
  let controller: IntegrationController
  let service: IntegrationService
  let mockPrisma: any

  const dummyUser: any = {
    id: 'user-1',
    email: 'test@example.com'
  }

  beforeEach(async () => {
    mockPrisma = {
      integration: {
        findUnique: jest.fn()
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationController],
      providers: [
        {
          provide: IntegrationService,
          useValue: {
            verifyIntegration: jest.fn()
          }
        }
      ]
    }).compile()

    controller = module.get<IntegrationController>(IntegrationController)
    service = module.get<IntegrationService>(IntegrationService)
  })

  describe('BaseIntegration.verifyIntegrity()', () => {
    it('CASE 1: should return success when configuration is valid', async () => {
      const plugin = new MockTestIntegration(mockPrisma)
      const rawMetadata = { botToken: 'xoxb-valid', channelId: 'C123' }
      plugin.setIntegration({
        id: 'int-1',
        type: IntegrationType.SLACK,
        metadata: encryptMetadata(rawMetadata as any)
      } as any)

      plugin.validateConfigMock.mockResolvedValueOnce(undefined)

      const result = await plugin.verifyIntegrity()

      expect(result).toEqual({
        success: true,
        message: 'SLACK integration configuration verified successfully'
      })
      expect(plugin.validateConfigMock).toHaveBeenCalledWith(rawMetadata)
    })

    it('CASE 2: should propagate error when validateConfiguration fails', async () => {
      const plugin = new MockTestIntegration(mockPrisma)
      const rawMetadata = { botToken: 'xoxb-invalid', channelId: 'C123' }
      plugin.setIntegration({
        id: 'int-1',
        type: IntegrationType.SLACK,
        metadata: encryptMetadata(rawMetadata as any)
      } as any)

      plugin.validateConfigMock.mockRejectedValueOnce(
        new BadRequestException('Slack token validation failed')
      )

      await expect(plugin.verifyIntegrity()).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('IntegrationController.verifyIntegration()', () => {
    it('CASE 3: controller endpoint delegates to service with correct arguments', async () => {
      const mockResult = {
        success: true,
        message: 'Integration verified successfully'
      }
      ;(service.verifyIntegration as jest.Mock).mockResolvedValueOnce(
        mockResult
      )

      const response = await controller.verifyIntegration(
        dummyUser,
        'slack-alerts'
      )

      expect(service.verifyIntegration).toHaveBeenCalledWith(
        dummyUser,
        'slack-alerts'
      )
      expect(response).toEqual(mockResult)
    })
  })
})
