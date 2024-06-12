import { IntegrationType } from '@prisma/client'
import { DiscordIntegration } from './discord.integration'

describe('Discord Integration Test', () => {
  let integration: DiscordIntegration

  beforeEach(() => {
    integration = new DiscordIntegration()
  })

  it('should generate discord integration', () => {
    expect(integration).toBeDefined()
    expect(integration.integrationType).toBe(IntegrationType.DISCORD)
  })

  it('should have the correct permitted events', () => {
    const events = integration.getPermittedEvents()
    expect(events).toBeDefined()
    expect(events.size).toBe(26)
  })

  it('should have the correct required metadata parameters', () => {
    const metadata = integration.getRequiredMetadataParameters()
    expect(metadata).toBeDefined()
    expect(metadata.size).toBe(1)
    expect(metadata.has('webhookUrl')).toBe(true)
  })
})
