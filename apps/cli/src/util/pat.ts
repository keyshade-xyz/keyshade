import { log, select, spinner, text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'

export const PatUtils = {
  /**
   * Shows a selection menu for all personal access tokens of the user.
   * This function returns the id of the selected personal access token.
   * If the user cancels the selection, the function will return null.
   *
   * @param {Record<string, string>} headers - The headers to be used for the request.
   * @returns {Promise<string|null>} the id of the selected personal access token or null if the user cancels.
   */
  selectPatFromMenu: async (
    headers: Record<string, string>
  ): Promise<string> => {
    const loading = spinner()
    loading.start('Fetching your personal access tokens...')

    // Fetch all the PATs
    const { data, success, error } =
      await ControllerInstance.getInstance().personalAccessTokenController.getAllPersonalAccessTokens(
        headers
      )

    loading.stop()
    clearSpinnerLines()

    if (success) {
      if (data.length === 0) {
        log.message("You don't have any personal access tokens!")
        process.exit(1)
      }

      const pat = await select({
        message: 'Select the personal access token',
        options: data.map((p) => ({
          value: p.id,
          label: p.name
        }))
      })

      handleSIGINT(pat, 'See you later!')

      return pat as string
    } else if (error) {
      loading.stop()
      clearSpinnerLines()
      log.error(
        `We encountered an error while fetching your personal access tokens: ${JSON.parse(error.message).body}`
      )
    }
  },

  readName: async (): Promise<string | undefined> => {
    const name = await text({
      message: 'Enter the new name for the token',
      placeholder: 'DESKTOP_KEY'
    })

    handleSIGINT(name, 'Update cancelled!')

    return name ? (name as string).trim() : undefined
  },

  readExpiresAfterDays: async (): Promise<number | undefined> => {
    const expiry = await text({
      message: 'Enter the new expiry for the token',
      placeholder: '30'
    })

    handleSIGINT(expiry, 'Update cancelled!')

    return expiry ? parseInt((expiry as string).trim()) : undefined
  }
}
