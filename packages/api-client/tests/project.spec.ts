import { APIClient } from '../src/core/client'
import ProjectController from '@api-client/controllers/project'

describe('Get Project Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const projectController = new ProjectController(backendUrl)

  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null

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

    workspaceId = workspaceResponse.id
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create a project
    const project = (
      await projectController.createProject(
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
    ).data

    projectId = project.id
  })

  afterEach(async () => {
    // Delete all projects
    await client.delete(`/api/project/${projectId}`, {
      'x-e2e-user-email': email
    })
  })

  it('should create a project', async () => {
    const project = (
      await projectController.createProject(
        {
          name: 'Project 2',
          description: 'Project Description',
          storePrivateKey: true,
          workspaceId,
          accessLevel: 'GLOBAL'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(project.id).toBeDefined()
    expect(project.name).toBe('Project 2')
    expect(project.description).toBe('Project Description')
    expect(project.storePrivateKey).toBe(true)
    expect(project.workspaceId).toBe(workspaceId)
    expect(project.publicKey).toBeDefined()
    expect(project.privateKey).toBeDefined()
    expect(project.createdAt).toBeDefined()
    expect(project.updatedAt).toBeDefined()

    // Delete the project
    await projectController.deleteProject(
      {
        projectId: project.id
      },
      {
        'x-e2e-user-email': email
      }
    )
  })

  it('should be able to get a project by ID', async () => {
    const project = (
      await projectController.getProject(
        {
          projectId
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(project.id).toBe(projectId)
    expect(project.name).toBe('Project')
  })

  it('should fork the project', async () => {
    const fork = (
      await projectController.forkProject(
        {
          projectId,
          workspaceId,
          name: 'Forked Stuff'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(fork.isForked).toBe(true)
    expect(fork.forkedFromId).toBe(projectId)

    // Delete the fork
    await projectController.deleteProject(
      {
        projectId: fork.id
      },
      {
        'x-e2e-user-email': email
      }
    )
  })

  it('should be able to get all forks of the project', async () => {
    // Create a fork of the project
    const fork = (
      await projectController.forkProject(
        {
          projectId,
          workspaceId,
          name: 'Forked Stuff'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    const forks = await projectController.getForks(
      {
        projectId,
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(forks.data.items).toHaveLength(1)

    // Delete the fork
    await projectController.deleteProject(
      {
        projectId: fork.id
      },
      {
        'x-e2e-user-email': email
      }
    )
  })

  it('should unlink fork the project', async () => {
    // Create a fork of the project
    const fork = (
      await projectController.forkProject(
        {
          projectId,
          workspaceId,
          name: 'Forked Stuff'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    // Unlink the fork
    await projectController.unlinkFork(
      {
        projectId: fork.id,
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )

    const forks = await projectController.getForks(
      {
        projectId,
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(forks.data.items).toHaveLength(0)

    // Delete the fork
    await projectController.deleteProject(
      {
        projectId: fork.id
      },
      {
        'x-e2e-user-email': email
      }
    )
  })

  it('should get all projects in the workspace', async () => {
    const projects = await projectController.getAllProjects(
      {
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(projects.data.items).toHaveLength(1)
  })

  it('should get delete a the project', async () => {
    await projectController.deleteProject(
      {
        projectId
      },
      {
        'x-e2e-user-email': email
      }
    )

    const projects = await projectController.getAllProjects(
      {
        workspaceId
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(projects.data.items).toHaveLength(0)
  })
})
