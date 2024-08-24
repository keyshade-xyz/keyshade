import VariableController from '../src/controllers/variable'
import { APIClient } from '../src/core/client'

describe('Get Variable Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const variableController = new VariableController(backendUrl)
  const email = 'johndoe@example.com'
  let workspaceId: string | null
  let projectId: string | null
  let environment: any
  let variableId: string | null

  beforeAll(async () => {
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

    workspaceId = workspaceResponse.id

    // Create a project
    const projectResponse = (await (
      await client.post(
        `/api/project/${workspaceId}`,
        {
          name: 'Project',
          storePrivateKey: true
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    projectId = projectResponse.id

    const createEnvironmentResponse = (await (
      await client.post(
        `/api/environment/${projectId}`,
        {
          name: 'Dev'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    environment = createEnvironmentResponse
  })
  afterAll(async () => {
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  // Create a variable
  it('should create a variable', async () => {
    const variable = await variableController.createVariable(
      {
        projectId,
        name: 'Variable 1',
        entries: [{ value: 'Variable 1 value', environmentId: environment.id }]
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(variable.data.name).toBe('Variable 1')
    expect(variable.data.projectId).toBe(projectId)
    expect(variable.data.project.workspaceId).toBe(workspaceId)
    expect(variable.data.versions.length).toBe(1)
    expect(variable.data.versions[0].value).toBe('Variable 1 value')
    expect(variable.data.versions[0].environmentId).toBe(environment.id)
    variableId = variable.data.id
  })

  // Update Name of the Variable
  it('should update the name a variable', async () => {
    const updatedVariable = await variableController.updateVariable(
      {
        name: 'UpdatedVariable 1',
        variableId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(updatedVariable.data.variable.name).toBe('UpdatedVariable 1')
    expect(updatedVariable.data.variable.id).toBe(variableId)
  })

  // Create a new version of Variable
  it('should add version to a variable', async () => {
    const updateVariable = await variableController.updateVariable(
      {
        entries: [
          {
            value: '1234',
            environmentId: environment.id
          }
        ],
        variableId
      },
      { 'x-e2e-user-email': email }
    )
    expect(updateVariable.data.updatedVersions.length).toBe(1)
    expect(updateVariable.data.updatedVersions[0].value).toBe('1234')
    expect(updateVariable.data.updatedVersions[0].environmentId).toBe(
      environment.id
    )
  })

  // Roll back a variable
  it('should rollback a variable', async () => {
    const rolledBackVariable: any = await variableController.rollbackVariable(
      {
        variableId,
        version: 1,
        environmentId: environment.id
      },
      { 'x-e2e-user-email': email }
    )
    expect(rolledBackVariable.data.count).toBe(1)
  })

  // Get all the variables of project
  it('should get all variables of project', async () => {
    const response: any = await variableController.getAllVariablesOfProject(
      { projectId },
      { 'x-e2e-user-email': email }
    )
    expect(response.data.items.length).toBe(1)
    const variable1 = response.data.items[0]
    const variable = variable1.variable
    const values = variable1.values
    expect(variable).toHaveProperty('id')
    expect(typeof variable.id).toBe('string')

    expect(variable).toHaveProperty('name')
    expect(typeof variable.name).toBe('string')

    expect(variable).toHaveProperty('createdAt')
    expect(typeof variable.createdAt).toBe('string')

    expect(variable).toHaveProperty('updatedAt')
    expect(typeof variable.updatedAt).toBe('string')

    expect(variable).toHaveProperty('note')
    expect(typeof variable.note === 'string' || variable.note === null).toBe(
      true
    )

    expect(variable).toHaveProperty('lastUpdatedById')
    expect(typeof variable.lastUpdatedById).toBe('string')

    expect(variable).toHaveProperty('projectId')
    expect(typeof variable.projectId).toBe('string')

    expect(variable).toHaveProperty('lastUpdatedBy')
    expect(variable.lastUpdatedBy).toHaveProperty('id')
    expect(typeof variable.lastUpdatedBy.id).toBe('string')
    expect(variable.lastUpdatedBy).toHaveProperty('name')
    expect(typeof variable.lastUpdatedBy.name).toBe('string')

    values.forEach((value) => {
      expect(value).toHaveProperty('environment')
      expect(value.environment).toHaveProperty('id')
      expect(typeof value.environment.id).toBe('string')
      expect(value.environment).toHaveProperty('name')
      expect(typeof value.environment.name).toBe('string')

      expect(value).toHaveProperty('value')
      expect(typeof value.value).toBe('string')

      expect(value).toHaveProperty('version')
      expect(typeof value.version).toBe('number')
    })
  })

  // Get all variables for an environment
  it('should get all variables for an environment', async () => {
    const variables: any =
      await variableController.getAllVariablesOfEnvironment(
        {
          environmentId: environment.id,
          projectId
        },
        { 'x-e2e-user-email': email }
      )

    expect(variables.data.length).toBe(1)
    variables.data.forEach((variable) => {
      expect(variable).toHaveProperty('name')
      expect(typeof variable.name).toBe('string')

      expect(variable).toHaveProperty('value')
      expect(typeof variable.value).toBe('string')

      expect(variable).toHaveProperty('isPlaintext')
      expect(typeof variable.isPlaintext).toBe('boolean')
    })
    const variable1 = variables.data[0]
    expect(variable1.name).toBe('UpdatedVariable 1')
    expect(variable1.value).toBe('Variable 1 value')
    expect(variable1.isPlaintext).toBe(true)
  })

  // Delete a variable
  it('should delete variable', async () => {
    await variableController.deleteVariable(
      { variableId },
      { 'x-e2e-user-email': email }
    )
    const variables: any = await variableController.getAllVariablesOfProject(
      { projectId },
      { 'x-e2e-user-email': email }
    )
    expect(variables.data.items.length).toBe(0)
  })
})
