import client from '@package/client'
import SecretController from '@package/controllers/secret/secret'

describe('Get Variable tests', () => {
  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let environment: any
  let secretId: string

  beforeAll(async () => {
    //Create the user's workspace
    const workspaceResponse = (await client.post(
      '/api/workspace',
      {
        name: 'My Workspace'
      },
      {
        'x-e2e-user-email': email
      }
    )) as any

    workspaceId = workspaceResponse.id

    // Create a project
    const projectResponse = (await client.post(
      `/api/project/${workspaceId}`,
      {
        name: 'Project',
        storePrivateKey: true
      },
      {
        'x-e2e-user-email': email
      }
    )) as any

    projectId = projectResponse.id

    // Create an environment
    const createEnvironmentResponse = await client.post(
      `/api/environment/${projectId}`,
      {
        name: 'Dev'
      },
      {
        'x-e2e-user-email': email
      }
    )

    environment = createEnvironmentResponse
  })

  afterAll(async () => {
    // Delete the environment
    await client.delete(`/api/environment/${environment.id}`, {
      'x-e2e-user-email': email
    })

    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  // Create a Secret
  it('should create a secret', async () => {
    const secret = await SecretController.createSecret(
      {
        name: 'Secret 1',
        note: 'Secret 1 note',
        entries: [
          {
            environmentId: environment.id,
            value: 'Secret 1 value'
          }
        ],
        projectId
      },
      { 'x-e2e-user-email': email }
    )
    expect(secret.projectId).toBe(projectId)
    expect(secret.project.workspaceId).toBe(workspaceId)
    expect(secret.name).toBe('Secret 1')
    expect(secret.versions.length).toBe(1)
    secretId = secret.id
  })

  // Update Name of a Secret
  it('should update name of a secret', async () => {
    const updatedSecret = await SecretController.updateSecret(
      {
        name: 'Updated Secret 1',
        secretId
      },
      { 'x-e2e-user-email': email }
    )
    expect(updatedSecret.secret.name).toBe('Updated Secret 1')
  })

  // Add Version to a Secret
  it('should add version of a secret', async () => {
    const updatedSecret = await SecretController.updateSecret(
      {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentId: environment.id
          }
        ],
        secretId
      },
      { 'x-e2e-user-email': email }
    )
    console.log(updatedSecret)
    expect(updatedSecret.updatedVersions.length).toBe(1)
  })

  // RollBack a Particular Version of a Secret
  it('should roll back a version of a secret', async () => {
    const rollbackSecret = await SecretController.rollbackSecret(
      { secretId, environmentId: environment.id, version: 1 },
      { 'x-e2e-user-email': email }
    )
    expect(rollbackSecret.count).toBe(1)
  })

  // Get all secrets of a Project
  it('should get all secrets of a project', async () => {
    const secrets: any = await SecretController.getAllSecretsOfProject(
      { projectId },
      { 'x-e2e-user-email': email }
    )
    expect(secrets.length).toBe(1)
  })

  // Get all secrets of an Environment
  it('should get all secrets of an environment', async () => {
    const secrets: any = await SecretController.getAllSecretsOfEnvironment(
      {
        environmentId: environment.id,
        projectId: projectId
      },
      { 'x-e2e-user-email': email }
    )
    expect(secrets.length).toBe(1)
    secrets.forEach((secret) => {
      expect(secret).toHaveProperty('name')
      expect(typeof secret.name).toBe('string')

      expect(secret).toHaveProperty('value')
      expect(typeof secret.value).toBe('string')

      expect(secret).toHaveProperty('isPlaintext')
      expect(typeof secret.isPlaintext).toBe('boolean')
    })
  })

  // Delete a Secert from a Project
  it('should delete a secret', async () => {
    await SecretController.deleteSecret(
      { secretId },
      { 'x-e2e-user-email': email }
    )
    const secrets: any = await SecretController.getAllSecretsOfProject(
      { projectId },
      { 'x-e2e-user-email': email }
    )
    expect(secrets.length).toBe(0)
  })
})
