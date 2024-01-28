import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceService } from './workspace.service'
import { WorkspacePermission } from '../misc/workspace.permission'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { workspaces } from '../../common/mock-data/workspaces'
import { users } from '../../common/mock-data/users'
import { WorkspaceRole } from '@prisma/client'

const mockPrisma = {
  user: {
    findUnique: jest.fn().mockImplementation((args) => {
      const user = users.find((u) => u.id === args.where.id)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    })
  },
  apiKeyWorkspaceScope: {
    deleteMany: jest.fn()
  },
  workspace: {
    create: jest.fn().mockImplementation((args) => {
      return {
        id: '4',
        name: args.data.name,
        description: args.data.description,
        isFreeTier: args.data.isFreeTier,
        isDefault: args.data.isDefault,
        createdAt: new Date('2022-01-04T00:00:00Z'),
        updatedAt: new Date('2022-01-04T00:00:00Z'),
        lastUpdatedById: '1',
        ownerId: args.data.ownerId
      }
    }),
    update: jest.fn().mockImplementation((args) => {
      const workspace = workspaces[0]
      return {
        ...workspace,
        name: args.data.name ?? workspace.name,
        description: args.data.description ?? workspace.description,
        isFreeTier: args.data.isFreeTier ?? workspace.isFreeTier,
        isDefault: args.data.isDefault ?? workspace.isDefault,
        updatedAt: new Date('2022-01-05T00:00:00Z'),
        lastUpdatedById: '1'
      }
    }),
    findMany: jest.fn().mockImplementation(() => workspaces),
    findUnique: jest.fn().mockImplementation((args) => {
      const workspace = workspaces.find((w) => w.id === args.where.id)
      if (!workspace) {
        throw new Error('Workspace not found')
      }
      // @ts-expect-error - Mocking
      workspace.members = users
        .filter((u) => u.id === workspace.ownerId)
        .map((u) => ({
          userId: u.id,
          role: 'OWNER'
        }))
      return workspace
    }),
    delete: jest.fn().mockImplementation((args) => {
      const workspace = workspaces.find((w) => w.id === args.where.id)
      if (!workspace) {
        throw new Error('Workspace not found')
      }
      return workspace
    }),
    count: jest.fn().mockImplementation(
      (args: {
        where: {
          name: string
        }
      }) => {
        const filtered = workspaces.filter((w) => {
          return w.name.includes(args.where.name)
        })
        return filtered.length
      }
    )
  }
}

describe('WorkspaceService', () => {
  let service: WorkspaceService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        WorkspacePermission,
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        JwtService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile()

    service = module.get<WorkspaceService>(WorkspaceService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should be able to create a workspace', async () => {
    const user = users[0]
    const workspace = await service.createWorkspace(user, {
      name: 'Workspace 4',
      description: 'This is workspace 4',
      members: []
    })
    expect(workspace.id).toEqual('4')
    expect(workspace.name).toEqual('Workspace 4')
    expect(workspace.description).toEqual('This is workspace 4')
    expect(workspace.isFreeTier).toEqual(true)
    expect(workspace.isDefault).toEqual(false)
    expect(workspace.ownerId).toEqual('1')
  })

  it('should be able to update an existing workspace', async () => {
    const user = users[0]
    const workspace = await service.updateWorkspace(user, '1', {
      name: 'Workspace 1 Updated',
      description: 'This is workspace 1 updated'
    })
    expect(workspace.id).toEqual('1')
    expect(workspace.name).toEqual('Workspace 1 Updated')
    expect(workspace.description).toEqual('This is workspace 1 updated')
    expect(workspace.isFreeTier).toEqual(true)
    expect(workspace.isDefault).toEqual(false)
  })

  it('should not be able to update a workspace that does not belong to the user', async () => {
    const user = users[0]
    await expect(
      service.updateWorkspace(user, '2', {
        name: 'Workspace 2 Updated',
        description: 'This is workspace 2 updated'
      })
    ).rejects.toThrow(`User ${user.id} is not a member of workspace 2`)
  })

  it('should not be able to update a workspace with duplicate name', async () => {
    const user = users[0]
    await expect(
      service.updateWorkspace(user, '1', {
        name: 'Workspace 3',
        description: 'This is workspace 3'
      })
    ).rejects.toThrow('Workspace already exists')
  })

  it('should throw an error while updating a non-existing workspace', async () => {
    const user = users[0]
    await expect(
      service.updateWorkspace(user, '4', {
        name: 'Workspace 4',
        description: 'This is workspace 4'
      })
    ).rejects.toThrow('Workspace not found')
  })

  it('should be able to delete an existing workspace', async () => {
    const user = users[0]
    expect(await service.deleteWorkspace(user, '1')).toBeUndefined()
  })

  it('should not be able to delete a workspace that does not belong to the user', async () => {
    const user = users[0]
    await expect(service.deleteWorkspace(user, '2')).rejects.toThrow(
      `User ${user.id} is not a member of workspace 2`
    )
  })

  it('should throw an error while deleting a non-existing workspace', async () => {
    const user = users[0]
    await expect(service.deleteWorkspace(user, '4')).rejects.toThrow(
      'Workspace not found'
    )
  })

  it('should be able to get a workspace by its id', async () => {
    const user = users[0]
    const workspace = await service.getWorkspaceById(user, '1')
    expect(workspace.id).toEqual('1')
    expect(workspace.name).toEqual('Workspace 1')
    expect(workspace.description).toEqual('This is workspace 1')
    expect(workspace.isFreeTier).toEqual(true)
    expect(workspace.isDefault).toEqual(false)
    expect(workspace.ownerId).toEqual('1')
  })

  it('should not be able to get a workspace that does not belong to the user', async () => {
    const user = users[0]
    await expect(service.getWorkspaceById(user, '2')).rejects.toThrow(
      `User ${user.id} is not a member of workspace 2`
    )
  })

  it('should throw an error while getting a non-existing workspace', async () => {
    const user = users[0]
    await expect(service.getWorkspaceById(user, '4')).rejects.toThrow(
      'Workspace not found'
    )
  })

  it('should be able to get all workspaces', async () => {
    const workspaces = await service.getWorkspaces(0, 3, 'name', 'asc', '')
    expect(workspaces.length).toEqual(3)
  })
})
