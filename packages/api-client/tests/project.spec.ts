// import client from '@package/client'
// import ProjectController from '@package/controllers/project/project'

// describe('Get Project Tests', () => {
//   const email = 'johndoe@example.com'
//   let projectId: string | null
//   let workspaceId: string | null

//   beforeAll(async () => {
//     try {
//       //Create the user's workspace
//       const workspaceResponse = (await client.post(
//         '/api/workspace',
//         {
//           name: 'My Workspace'
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )) as any

//       workspaceId = workspaceResponse.id
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   afterAll(async () => {
//     try {
//       // Delete the workspace
//       await client.delete(`/api/workspace/${workspaceId}`, {
//         'x-e2e-user-email': email
//       })
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })
//   it('should create a project', async () => {
//     try {
//       const project = await ProjectController.createProject(
//         {
//           name: 'Project',
//           description: 'Project Description',
//           storePrivateKey: true,
//           workspaceId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       expect(project.id).toBeDefined()
//       expect(project.name).toBe('Project')
//       expect(project.description).toBe('Project description')
//       expect(project.storePrivateKey).toBe(true)
//       expect(project.workspaceId).toBe(workspaceId)
//       expect(project.publicKey).toBeDefined()
//       expect(project.privateKey).toBeDefined()
//       expect(project.createdAt).toBeDefined()
//       expect(project.updatedAt).toBeDefined()
//       projectId = project.id
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   it('should return the project', async () => {
//     try {
//       const project = await ProjectController.getProject(
//         {
//           projectId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       expect(project.id).toBe(projectId)
//       expect(project.name).toBe('Project')
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   it('should fork the project', async () => {
//     try {
//       const project = await ProjectController.forkProject(
//         {
//           name: 'Project',
//           projectId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       expect(project.isForked).toBe(true)
//       expect(project.forkedFromId).toBe(projectId)
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   it('should get all fork the project', async () => {
//     try {
//       const forks = await ProjectController.getForks(
//         {
//           projectId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       expect(forks).toHaveLength(1)
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   it('should unlink fork the project', async () => {
//     try {
//       await ProjectController.unlinkFork(
//         {
//           projectId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       const forks = await ProjectController.getForks(
//         {
//           projectId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       expect(forks).toHaveLength(0)
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   it('should get all projects in the workspace', async () => {
//     try {
//       const projects = await ProjectController.getAllProjects(
//         {
//           workspaceId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//       expect(projects).toHaveLength(1)
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })

//   it('should get delete a the project', async () => {
//     try {
//       await ProjectController.deleteProject(
//         {
//           projectId
//         },
//         {
//           'x-e2e-user-email': email
//         }
//       )
//     } catch (error) {
//       console.error(error)
//       process.exit(1)
//     }
//   })
// })
