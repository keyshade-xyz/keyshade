export interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  storePrivateKey: boolean
  isDisabled: boolean
  accessLevel: 'GLOBAL' | 'INTERNAL' | 'PRIVATE'
  isForked: boolean
  lastUpdatedById: string
  workspaceId: string
  forkedFromId: string
}

export interface ProjectData {
  name: string
  description?: string
  storePrivateKey?: boolean
  environments?: CreateEnvironment[]
  accessLevel?: 'GLOBAL' | 'INTERNAL' | 'PRIVATE'
}

export interface CreateEnvironment {
  name: string
  description?: string
}
