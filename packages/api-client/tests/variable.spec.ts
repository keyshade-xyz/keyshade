import VariableController from '../src/controllers/variable'
import { APIClient } from '../src/core/client'

describe('Get Variable Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const variableController = new VariableController(backendUrl)
  const email = 'johndoe@example.com'
  let workspaceSlug: string | null
  let projectSlug: string | null
  let environment
  let variableSlug: string | null

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

    environment = createEnvironmentResponse
  })

  afterAll(async () => {
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    const variable = await variableController.createVariable(
      {
        projectSlug,
        name: 'Variable 1',
        entries: [
          { value: 'Variable 1 value', environmentSlug: environment.slug }
        ]
      },
      {
        'x-e2e-user-email': email
      }
    )

    variableSlug = variable.data.slug
  })

  afterEach(async () => {
    await variableController.deleteVariable(
      {
        variableSlug
      },
      {
        'x-e2e-user-email': email
      }
    )
  })

  // Create a variable
  it('should create a variable', async () => {
    const variable = await variableController.createVariable(
      {
        projectSlug,
        name: 'Variable 2',
        entries: [
          { value: 'Variable 2 value', environmentSlug: environment.slug }
        ]
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(variable.data.name).toBe('Variable 2')
    expect(variable.data.versions.length).toBe(1)
    expect(variable.data.versions[0].value).toBe('Variable 2 value')
    expect(variable.data.versions[0].environmentId).toBe(environment.id)
    expect(variable.data.versions[0].environment.slug).toBe(environment.slug)

    // Delete the variable
    const deleteVariable = await variableController.deleteVariable(
      {
        variableSlug: variable.data.slug
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(deleteVariable.success).toBe(true)
  })

  // Update Name of the Variable
  it('should update the name a variable', async () => {
    const updatedVariable = await variableController.updateVariable(
      {
        name: 'UpdatedVariable 1',
        variableSlug
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(updatedVariable.data.variable.name).toBe('UpdatedVariable 1')

    // Delete the variable
    const deleteVariable = await variableController.deleteVariable(
      {
        variableSlug: updatedVariable.data.variable.slug
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(deleteVariable.success).toBe(true)
  })

  // Create a new version of Variable
  it('should add version to a variable', async () => {
    const updateVariable = await variableController.updateVariable(
      {
        entries: [
          {
            value: '1234',
            environmentSlug: environment.slug
          }
        ],
        variableSlug
      },
      { 'x-e2e-user-email': email }
    )
    expect(updateVariable.data.updatedVersions.length).toBe(1)
    expect(updateVariable.data.updatedVersions[0].value).toBe('1234')
    expect(updateVariable.data.updatedVersions[0].environmentId).toBe(
      environment.id
    )
    expect(updateVariable.data.updatedVersions[0].environment.slug).toBe(
      environment.slug
    )
  })

  // Roll back a variable
  it('should rollback a variable', async () => {
    // Add a new version
    await variableController.updateVariable(
      {
        entries: [
          {
            value: '1234',
            environmentSlug: environment.slug
          }
        ],
        variableSlug
      },
      { 'x-e2e-user-email': email }
    )

    const rolledBackVariable = await variableController.rollbackVariable(
      {
        variableSlug,
        version: 1,
        environmentSlug: environment.slug
      },
      { 'x-e2e-user-email': email }
    )
    expect(rolledBackVariable.data.count).toBe(1)
  })

  // Get all the variables of project
  it('should get all variables of project', async () => {
    const response = await variableController.getAllVariablesOfProject(
      { projectSlug },
      { 'x-e2e-user-email': email }
    )

    expect(response.data.items.length).toBe(1)
    const variable1 = response.data.items[0]
    const variable = variable1.variable
    const values = variable1.values
    expect(variable).toHaveProperty('slug')

    expect(variable).toHaveProperty('name')
    expect(variable).toHaveProperty('createdAt')
    expect(variable).toHaveProperty('updatedAt')
    expect(variable).toHaveProperty('note')
    expect(variable).toHaveProperty('lastUpdatedById')

    expect(variable.lastUpdatedBy).toHaveProperty('id')
    expect(variable.lastUpdatedBy).toHaveProperty('name')

    values.forEach((value) => {
      expect(value).toHaveProperty('environment')
      expect(value.environment).toHaveProperty('id')
      expect(value.environment).toHaveProperty('name')
      expect(value.environment).toHaveProperty('slug')
      expect(value).toHaveProperty('value')
      expect(value).toHaveProperty('version')
    })
  })

  // Get all variables for an environment
  it('should get all variables for an environment', async () => {
    const variables = await variableController.getAllVariablesOfEnvironment(
      {
        environmentSlug: environment.slug,
        projectSlug
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
    expect(variable1.name).toBe('Variable 1')
    expect(variable1.value).toBe('Variable 1 value')
    expect(variable1.isPlaintext).toBe(true)
  })

  // Delete a variable
  it('should delete variable', async () => {
    await variableController.deleteVariable(
      { variableSlug },
      { 'x-e2e-user-email': email }
    )
    const variables = await variableController.getAllVariablesOfProject(
      { projectSlug },
      { 'x-e2e-user-email': email }
    )
    expect(variables.data.items.length).toBe(0)
  })

  it('should be able to fetch revisions of a secret', async () => {
    const revisions = await variableController.getRevisionsOfVariable(
      { variableSlug, environmentSlug: environment.slug },
      { 'x-e2e-user-email': email }
    )
    expect(revisions.data.items.length).toBe(1)
  })
})
