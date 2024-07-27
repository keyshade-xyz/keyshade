import client from '@package/client'
import ProjectController from '@package/controllers/project/project'

describe('Get Project Tests', () => {
  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let forkedProjectId: string | null

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
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })
  it('should create a project', async () => {
    const project = await ProjectController.createProject(
      {
        name: 'Project',
        description: 'Project Description',
        storePrivateKey: true,
        workspaceId,
        accessLevel: 'GLOBAL'
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(project.id).toBeDefined()
    expect(project.name).toBe('Project')
    expect(project.description).toBe('Project Description')
    expect(project.storePrivateKey).toBe(true)
    expect(project.workspaceId).toBe(workspaceId)
    expect(project.publicKey).toBeDefined()
    expect(project.privateKey).toBeDefined()
    expect(project.createdAt).toBeDefined()
    expect(project.updatedAt).toBeDefined()
    projectId = project.id
  })

  it('should return the project', async () => {
    const project = await ProjectController.getProject(
      {
        projectId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(project.id).toBe(projectId)
    expect(project.name).toBe('Project')
  })

  it('should fork the project', async () => {
    const fork = await ProjectController.forkProject(
      {
        projectId,
        workspaceId,
        name: 'Forked Stuff'
      },
      {
        'x-e2e-user-email': email
      }
    )
    forkedProjectId = fork.id
    expect(fork.isForked).toBe(true)
    expect(fork.forkedFromId).toBe(projectId)
  })

  it('should get all fork the project', async () => {
    const forks = await ProjectController.getForks(
      {
        projectId,
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(forks).toHaveLength(1)
  })

  it('should unlink fork the project', async () => {
    await ProjectController.unlinkFork(
      {
        projectId: forkedProjectId,
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    const forks = await ProjectController.getForks(
      {
        projectId,
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(forks).toHaveLength(0)
  })

  it('should get all projects in the workspace', async () => {
    const projects = await ProjectController.getAllProjects(
      {
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(projects).toHaveLength(2)
  })

  it('should get delete a the project', async () => {
    await ProjectController.deleteProject(
      {
        projectId
      },
      {
        'x-e2e-user-email': email
      }
    )
  })
})
