import { select, spinner } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'

export const EnvironmentUtils = {
  selectEnvironmentFromMenu: async (
    projectSlug: string,
    headers: Record<string, string>
  ): Promise<string> => {
    const loading = spinner()
    loading.start('Fetching your environments...')

    // Fetch all the environments of the project
    const { data, success, error } =
      await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
        {
          projectSlug,
          limit: 100
        },
        headers
      )

    loading.stop()
    clearSpinnerLines()

    if (success) {
      if (data.items.length === 0) {
        throw new Error("You don't have any environments in this project!")
      }

      const environment = await select({
        message: 'Select the environment',
        options: data.items.map((p) => ({
          value: p.slug,
          label: `${p.name} (${p.slug})`
        }))
      })

      handleSIGINT(environment, 'See you later!')

      return environment as string
    } else if (error) {
      loading.stop()
      clearSpinnerLines()
      throw new Error(
        `We encountered an error while fetching your environments: ${JSON.parse(error.message).body}`
      )
    }
  }
}
