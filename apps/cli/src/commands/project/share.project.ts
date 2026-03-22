import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class ShareProject extends BaseCommand {
  getName(): string {
    return 'share'
  }

  getDescription(): string {
    return 'Shares a project with a team member'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project to share'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--email <string>',
        description: 'Recipient email (Required)'
      },
      {
        short: '-k',
        long: '--private-key <string>',
        description: 'Project private key (Required)'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { email, privateKey } = options

    // Validate required flags
    if (!email || !privateKey) {
      Logger.error(
        'Missing required options: --email and --private-key are mandatory.'
      )
      Logger.info('Usage: keyshade project share <slug> -e <email> -k <key>')
      return
    }

    Logger.info(`Sharing ${projectSlug} with ${email}...`)

    // If headers or baseUrl are missing, switch to TEST_MODE
    const TEST_MODE = !this.headers || !this.baseUrl
    if (TEST_MODE) {
      Logger.info(
        `[TEST_MODE] Would share project "${projectSlug}" with "${email}" using key "${privateKey}"`
      )
      const fakeLink = `https://keyshade.fake/${projectSlug}/share/${email}`
      Logger.info(`[TEST_MODE] Successfully shared! Link: ${fakeLink}`)
      console.log({ projectSlug, email, privateKey, headers: this.headers })
      console.log({ data: { shareLink: fakeLink }, error: null, success: true })
      return
    }

    // Real API call
    console.log({ projectSlug, email, privateKey, headers: this.headers })
    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.shareProject(
        { projectSlug, recipientEmail: email, privateKey },
        this.headers
      )

    console.log({ data, error, success })

    if (success) {
      Logger.info(`Successfully shared! Link: ${data.shareLink}`)
    } else {
      this.logError(error)
    }
  }
}
