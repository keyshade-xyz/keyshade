import type { WorkspaceRole } from '@keyshade/schema'
import RoleNameCell from './role-name-cell'
import RoleMembersCell from './role-members-cell'
import RoleAuthoritiesCell from './role-authorities-cell'
import RoleProjectEnvironmentCell from './role-project-environment-cell'
import RoleActionCell from './role-action-cell'
import { TableRow } from '@/components/ui/table'

interface RoleListItemProps {
  role: WorkspaceRole
}

export default function RoleCard({
  role
}: RoleListItemProps): React.JSX.Element {
  return (
    <TableRow className="group h-full w-full hover:bg-white/5" key={role.id}>
      <RoleNameCell
        colorCode={role.colorCode}
        description={role.description}
        name={role.name}
      />
      <RoleMembersCell members={role.members} />
      <RoleAuthoritiesCell authorities={role.authorities} />
      <RoleProjectEnvironmentCell projects={role.projects} />
      <RoleActionCell role={role} />
    </TableRow>
  )
}
