import client from '@package/client'
import VariableController from '@package/controllers/variable/variable'

describe('Get Variable Tests', () => {
  const email = 'johndoe@example.com'
  let workspaceId: string | null
  let projectId: string | null
  let environment: any
  let variableId: string | null

  beforeAll(async () => {
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
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })
  it('should create a variable', async () => {
    const variable = await VariableController.createVariable(
      {
        projectId,
        name: 'Variable 1',
        entries: [{ value: 'Variable 1 value', environmentId: environment.id }]
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(variable.name).toBe('Variable 1')
    expect(variable.projectId).toBe(projectId)
    expect(variable.project.workspaceId).toBe(workspaceId)
    expect(variable.versions.length).toBe(1)
    expect(variable.versions[0].value).toBe('Variable 1 value')
    expect(variable.versions[0].environmentId).toBe(environment.id)
    variableId = variable.id
  })

  it('should update the name a variable', async () => {
    const updatedVariable = await VariableController.updateVariable(
      {
        name: 'UpdatedVariable 1',
        variableId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(updatedVariable.variable.name).toBe('UpdatedVariable 1')
    expect(updatedVariable.variable.id).toBe(variableId)
  })

  it('should add version to a variable', async () => {
    const updateVariable = await VariableController.updateVariable(
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
    expect(updateVariable.updatedVersions.length).toBe(1)
    expect(updateVariable.updatedVersions[0].value).toBe('1234')
    expect(updateVariable.updatedVersions[0].environmentId).toBe(environment.id)
  })

  it('should rollback a variable', async () => {
    const rolledBackVariable: any = await VariableController.rollbackVariable(
      {
        variableId,
        version: 1,
        environmentId: environment.id
      },
      { 'x-e2e-user-email': email }
    )
    expect(rolledBackVariable.count).toBe(1)
  })

  it('should get all variables of project', async () => {
    const variables: any = await VariableController.getAllVariablesOfProject(
      { projectId },
      { 'x-e2e-user-email': email }
    )
    expect(variables.length).toBe(1)
  })

  it('should get all variables for an environment', async () => {
    const variables: any =
      await VariableController.getAllVariablesOfEnvironment(
        {
          environmentId: environment.id,
          projectId
        },
        { 'x-e2e-user-email': email }
      )
    expect(variables.length).toBe(1)
  })
})
