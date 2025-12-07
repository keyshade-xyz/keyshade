import BaseCommand from '@/commands/base.command'
import {
  type CommandOption,
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import {
  clearSpinnerLines,
  handleSIGINT,
  showError,
  showSuccess
} from '@/util/prompt'
import { note, spinner, text } from '@clack/prompts'

export default class DeleteWorkspace extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes an existing workspace'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--no-confirm',
        description: 'Do not confirm the deletion of the workspace.'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const noConfirm = options.confirm === false
    const [workspaceSlug] = args

    let shouldContinueRemove = false

    if (!noConfirm) {
      note(
        [
          '✕ The secrets, variables, and environments related to this project would be removed permanently',
          '✕ Everyone in this workspace will lose access to this project',
          "✕ I can't retrieve the project in future"
        ].join('\n'),
        'You are about to delete this workspace. This action will:'
      )

      const confirmation = await text({
        message: `To confirm, please type the workspace slug "${workspaceSlug}"`,
        validate(value) {
          if (value !== workspaceSlug) {
            return 'The entered value does not match the workspace slug'
          }
          return ''
        }
      })

      handleSIGINT(confirmation, 'Workspace deletion cancelled!')

      shouldContinueRemove = confirmation === workspaceSlug
    } else {
      shouldContinueRemove = true
    }

    if (shouldContinueRemove) {
      const loading = spinner()
      loading.start('Deleting workspace...')

      let result: { success: boolean; error: string } | null = null

      try {
        const { success, error } =
          await ControllerInstance.getInstance().workspaceController.deleteWorkspace(
            {
              workspaceSlug
            },
            this.headers
          )
        result = { success, error: error.message }
      } finally {
        loading.stop()
        clearSpinnerLines()
      }

      if (result.success) {
        await showSuccess(`✅ Workspace ${workspaceSlug} deleted successfully!`)
      } else {
        await showError(`❌ ${result.error}`)
      }
    }
  }
}
