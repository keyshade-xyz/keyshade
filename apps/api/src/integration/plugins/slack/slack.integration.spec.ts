import { IntegrationType } from '@prisma/client'
import { SlackIntegration } from './slack.integration'

describe('Slack Integration Test', () => {
  let integration: SlackIntegration

  beforeEach(() => {
    integration = new SlackIntegration()
  })

  it('should generate slack integration', () => {
    expect(integration).toBeDefined()
    expect(integration.integrationType).toBe(IntegrationType.SLACK)
  })

  it('should have the correct permitted events', () => {
    const events = integration.getPermittedEvents()
    expect(events).toBeDefined()
    expect(events.size).toBe(26)
  })

  it('should have the correct required metadata parameters', () => {
    const metadata = integration.getRequiredMetadataParameters()
    expect(metadata).toBeDefined()
    expect(metadata.size).toBe(3)
    expect(metadata.has('botToken')).toBe(true)
    expect(metadata.has('signingSecret')).toBe(true)
    expect(metadata.has('channelId')).toBe(true)
  })
})
