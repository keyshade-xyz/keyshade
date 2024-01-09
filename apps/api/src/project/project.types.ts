import {
  Project,
  ProjectMember,
  ProjectRole,
  Secret,
  User
} from '@prisma/client'

export interface ProjectWithMembers extends Project {
  members: ProjectMember[]
}

export interface ProjectWithUserRole extends Project {
  role: ProjectMember['role']
}

export interface ProjectWithSecrets extends Project {
  secrets: Secret[]
}

export interface ProjectWithMembersAndSecrets
  extends ProjectWithMembers,
    ProjectWithSecrets {}

export interface ProjectMembership {
  id: string
  role: ProjectRole
  user: User
  invitationAccepted: boolean
}
