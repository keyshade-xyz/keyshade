import { Workspace } from '@prisma/client'

export const workspaces: Workspace[] = [
  {
    id: '1',
    name: 'Workspace 1',
    description: 'This is workspace 1',
    isFreeTier: true,
    isDefault: false,
    createdAt: new Date('2022-01-01T00:00:00Z'),
    updatedAt: new Date('2022-01-01T00:00:00Z'),
    lastUpdatedById: '1',
    ownerId: '1'
  },
  {
    id: '2',
    name: 'Workspace 2',
    description: null,
    isFreeTier: false,
    isDefault: true,
    createdAt: new Date('2022-01-02T00:00:00Z'),
    updatedAt: new Date('2022-01-02T00:00:00Z'),
    lastUpdatedById: '1',
    ownerId: '2'
  },
  {
    id: '3',
    name: 'Workspace 3',
    description: 'This is workspace 3',
    isFreeTier: true,
    isDefault: false,
    createdAt: new Date('2022-01-03T00:00:00Z'),
    updatedAt: new Date('2022-01-03T00:00:00Z'),
    lastUpdatedById: '1',
    ownerId: '1'
  }
]
