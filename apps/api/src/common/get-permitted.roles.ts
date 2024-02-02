import { WorkspaceRole } from '@prisma/client'

const permittedRoles = (role: WorkspaceRole) => {
  switch (role) {
    case WorkspaceRole.OWNER:
      return [
        WorkspaceRole.OWNER,
        WorkspaceRole.MAINTAINER,
        WorkspaceRole.VIEWER
      ]
    case WorkspaceRole.MAINTAINER:
      return [WorkspaceRole.MAINTAINER, WorkspaceRole.VIEWER]
    case WorkspaceRole.VIEWER:
      return [WorkspaceRole.VIEWER]
  }
}

export default permittedRoles
