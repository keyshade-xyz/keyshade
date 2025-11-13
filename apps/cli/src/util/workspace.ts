import { select, spinner } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'

export const WorkspaceUtils = {
  selectWorkspaceFromMenu: async (
    headers: Record<string, string>
  ): Promise<string> => {
    const loading = spinner()
    loading.start('Fetching your workspaces...')

    // Fetch all the workspaces
    const { data, success, error } =
      await ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser(
        {
          limit: 100
        },
        headers
      )

    loading.stop()
    clearSpinnerLines()

    if (success) {
      if (data.items.length === 0) {
        throw new Error("You don't have any workspaces!")
      }

      const workspace = await select({
        message: 'Select the workspace',
        options: data.items.map((p) => ({
          value: p.slug,
          label: `${p.name} (${p.slug})`
        }))
      })

      handleSIGINT(workspace, 'See you later!')

      return workspace as string
    } else if (error) {
      loading.stop()
      clearSpinnerLines()
      throw new Error(
        `We encountered an error while fetching your workspaces: ${JSON.parse(error.message).body}`
      )
    }
  }
}
