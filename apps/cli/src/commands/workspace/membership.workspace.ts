import BaseCommand from '../base.command'
import AcceptInvitationCommand from './membership/accept-invitation.membership'
import CancelInvitationCommand from './membership/cancel-invitation.membership'
import DeclineInvitationCommand from './membership/decline-invitation.membership'
import GetAllMembersOfWorkspaceCommand from './membership/get-all-members.membership'
import InviteUserCommand from './membership/invite.membership'
import { LeaveWorkspaceCommand } from './membership/leave.membership'
import RemoveUserCommand from './membership/remove.membership'
import TransferOwnershipCommand from './membership/transfer-ownership.membership copy'
import UpdateRolesCommand from './membership/update-role.membership'

export default class WorkspaceMembershipCommand extends BaseCommand {
  getName(): string {
    return 'membership'
  }

  getDescription(): string {
    return 'Manage workspace memberships'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new AcceptInvitationCommand(),
      new CancelInvitationCommand(),
      new DeclineInvitationCommand(),
      new GetAllMembersOfWorkspaceCommand(),
      new InviteUserCommand(),
      new LeaveWorkspaceCommand(),
      new RemoveUserCommand(),
      new TransferOwnershipCommand(),
      new UpdateRolesCommand()
    ]
  }
}
