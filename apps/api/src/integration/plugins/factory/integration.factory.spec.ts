import { IntegrationType } from '@prisma/client'
import IntegrationFactory from './integration.factory'

describe('Integration Factory Test', () => {
  it('should generate discord integration', () => {
    const integration = IntegrationFactory.createIntegration(
      IntegrationType.DISCORD
    )
    expect(integration).toBeDefined()
    expect(integration.integrationType).toBe(IntegrationType.DISCORD)
  })
})
