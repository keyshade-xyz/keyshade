import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import { PAGINATION_OPTION } from '@/util/pagination-options'

export default class ListInvitations extends BaseCommand {
  getName(): string {
    return 'list-invitations'
  }

  getDescription(): string {
    return 'Fetches all the invitations to workspaces'
  }

  getOptions(): CommandOption[] {
    return PAGINATION_OPTION
  }

  async action({ options }: CommandActionData): Promise<void> {
    Logger.info('Fetching all invitations...')

    const { success, data, error } =
      await ControllerInstance.getInstance().workspaceController.getWorkspaceInvitations(
        {
          ...options
        },
        this.headers
      )

    if (success && data) {
      const invitations = data.items
      if (invitations.length > 0) {
        data.items.forEach((invitation: any) => {
          Logger.info(
            `- ${invitation.workspace.name} (${invitation.workspace.slug}) (${invitation.invitedOn})`
          )
        })
      } else {
        Logger.info('No invitations found')
      }
    } else {
      Logger.error(`Failed fetching invitations: ${error.message}`)
    }
  }
}
