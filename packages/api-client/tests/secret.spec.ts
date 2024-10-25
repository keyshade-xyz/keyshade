import { APIClient } from '../src/core/client'
import SecretController from '../src/controllers/secret'

describe('Secret Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const secretController = new SecretController(backendUrl)

  const email = 'johndoe@example.com'
  let projectSlug: string | null
  let workspaceSlug: string | null
  let secretSlug: string | null
  let environmentSlug: string | null

  beforeAll(async () => {
    //Create the user's workspace

    const workspaceResponse = (await (
      await client.post(
        '/api/workspace',
        {
          name: 'My Workspace'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    workspaceSlug = workspaceResponse.slug

    // Create a project
    const projectResponse = (await (
      await client.post(
        `/api/project/${workspaceSlug}`,
        {
          name: 'Project',
          storePrivateKey: true
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    projectSlug = projectResponse.slug

    const createEnvironmentResponse = (await (
      await client.post(
        `/api/environment/${projectSlug}`,
        {
          name: 'Dev'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    environmentSlug = createEnvironmentResponse.slug
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create a secret
    const createSecretResponse = await secretController.createSecret(
      {
        name: 'Secret 1',
        note: 'Secret 1 note',
        entries: [
          {
            environmentSlug,
            value: 'Secret 1 value'
          }
        ],
        projectSlug
      },
      { 'x-e2e-user-email': email }
    )
    secretSlug = createSecretResponse.data.slug
  })

  afterEach(async () => {
    // Delete the secret
    await secretController.deleteSecret(
      { secretSlug },
      { 'x-e2e-user-email': email }
    )
  })

  // Create a Secret
  it('should create a secret', async () => {
    const secret = await secretController.createSecret(
      {
        name: 'Secret 2',
        note: 'Secret 2 note',
        entries: [
          {
            environmentSlug,
            value: 'Secret 1 value'
          }
        ],
        projectSlug
      },
      { 'x-e2e-user-email': email }
    )

    expect(secret.data.name).toBe('Secret 2')
    expect(secret.data.slug).toBeDefined()
    expect(secret.data.versions.length).toBe(1)
    expect(secret.data.versions[0].environment.slug).toBe(environment.slug)
    expect(secret.error).toBe(null)

    // Delete the secret
    await secretController.deleteSecret(
      { secretSlug: secret.data.slug },
      { 'x-e2e-user-email': email }
    )
  })

  // Update Name of a Secret
  it('should update name of a secret', async () => {
    const updatedSecret = await secretController.updateSecret(
      {
        name: 'Updated Secret 1',
        secretSlug
      },
      { 'x-e2e-user-email': email }
    )
    expect(updatedSecret.data.secret.name).toBe('Updated Secret 1')

    // Delete the secret since the slug will be updated
    const deleteSecretResponse = await secretController.deleteSecret(
      { secretSlug: updatedSecret.data.secret.slug },
      { 'x-e2e-user-email': email }
    )

    expect(deleteSecretResponse.error).toBe(null)
  })

  // // Add Version to a Secret
  it('should add version of a secret', async () => {
    const updatedSecret = await secretController.updateSecret(
      {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentSlug
          }
        ],
        secretSlug
      },
      { 'x-e2e-user-email': email }
    )
    expect(updatedSecret.data.updatedVersions.length).toBe(1)
  })

  // // RollBack a Particular Version of a Secret
  it('should roll back a version of a secret', async () => {
    // Create 2 versions of the secret
    await secretController.updateSecret(
      {
        entries: [
          {
            value: 'Secret 1 value',
            environmentSlug
          }
        ],
        secretSlug
      },
      { 'x-e2e-user-email': email }
    )

    await secretController.updateSecret(
      {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentSlug
          }
        ],
        secretSlug
      },
      { 'x-e2e-user-email': email }
    )

    const rollbackSecret = await secretController.rollbackSecret(
      { secretSlug, environmentSlug, version: 1 },
      { 'x-e2e-user-email': email }
    )

    expect(rollbackSecret.data.count).toBe(2)
  })

  // // Get all secrets of a Project
  it('should get all secrets of a project', async () => {
    const secrets: any = await secretController.getAllSecretsOfProject(
      { projectSlug },
      { 'x-e2e-user-email': email }
    )
    expect(secrets.data.items.length).toBe(1)
  })

  // // Get all secrets of an Environment
  it('should get all secrets of an environment', async () => {
    const secrets: any = await secretController.getAllSecretsOfEnvironment(
      {
        environmentSlug,
        projectSlug
      },
      { 'x-e2e-user-email': email }
    )
    expect(secrets.data.length).toBe(1)
    secrets.data.forEach((secret) => {
      expect(secret).toHaveProperty('name')
      expect(typeof secret.name).toBe('string')

      expect(secret).toHaveProperty('value')
      expect(typeof secret.value).toBe('string')

      expect(secret).toHaveProperty('isPlaintext')
      expect(typeof secret.isPlaintext).toBe('boolean')
    })
  })

  // Delete a Secret from a Project
  it('should delete a secret', async () => {
    await secretController.deleteSecret(
      { secretSlug },
      { 'x-e2e-user-email': email }
    )
    const secrets: any = await secretController.getAllSecretsOfProject(
      { projectSlug },
      { 'x-e2e-user-email': email }
    )
    expect(secrets.data.items.length).toBe(0)
  })

  it('should be able to fetch revisions of a secret', async () => {
    const revisions = await secretController.getRevisionsOfSecret(
      { secretSlug, environmentSlug},
      { 'x-e2e-user-email': email }
    )
    expect(revisions.data.items.length).toBe(1)
  })
})
