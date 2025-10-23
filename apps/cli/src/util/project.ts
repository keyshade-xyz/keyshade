import { select, spinner } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'

export const ProjectUtils = {
  /**
   * Utilities for managing projects.
   */
  /**
   * Selects a project from a list of projects for the given workspace.
   * @param workspaceSlug The slug of the workspace.
   * @param headers The headers to be used for the request.
   * @returns The id of the selected project or null if the user cancels.
   */
  selectProjectFromMenu: async (
    workspaceSlug: string,
    headers: Record<string, string>
  ): Promise<string> => {
    const loading = spinner()
    loading.start('Fetching your projects...')

    // Fetch all the projects of the workspace
    const { data, success, error } =
      await ControllerInstance.getInstance().projectController.getAllProjects(
        {
          workspaceSlug,
          limit: 100
        },
        headers
      )

    loading.stop()
    clearSpinnerLines()

    if (success) {
      if (data.items.length === 0) {
        throw new Error("You don't have any projects in this workspace!")
      }

      const project = await select({
        message: 'Select the project',
        options: data.items.map((p) => ({
          value: p.slug,
          label: `${p.name} (${p.slug})`
        }))
      })

      handleSIGINT(project, 'See you later!')

      return project as string
    } else if (error) {
      loading.stop()
      clearSpinnerLines()
      throw new Error(
        `We encountered an error while fetching your projects: ${JSON.parse(error.message).body}`
      )
    }
  }
}
