import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from './base.command'
import { intro, text, confirm, outro, select, note } from '@clack/prompts'
import { existsSync } from 'fs'
import {
  writePrivateKeyConfig,
  writeProjectRootConfig
} from '@/util/configuration'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class InitCommand extends BaseCommand {
  getOptions(): CommandOption[] {
    return [
      {
        short: '-w',
        long: '--workspace <string>',
        description: 'Workspace slug to configure'
      },
      {
        short: '-p',
        long: '--project <string>',
        description: 'Project slug to configure'
      },
      {
        short: '-e',
        long: '--environment <string>',
        description: 'Environment slug to configure'
      },
      {
        short: '-k',
        long: '--private-key <string>',
        description: 'Private key for the project'
      },
      {
        short: '-o',
        long: '--overwrite',
        description: 'Overwrite existing configuration',
        defaultValue: false
      },
      {
        short: '-q',
        long: '--quit-on-decryption-failure',
        description: 'Quit on decryption failure',
        defaultValue: false
      }
    ]
  }

  getName(): string {
    return 'init'
  }

  getDescription(): string {
    return 'Initialize the configurations to enable live-updates in the current project'
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options }: CommandActionData): Promise<void> {
    let { workspace, project, environment, privateKey } = options
    const { overwrite, quitOnDecryptionFailure } = options

    intro('Configure the project for live-updates')

    if (!workspace) {
      const { success, data, error } =
        await ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser(
          {},
          this.headers
        )

      if (success) {
        const workspaces = data.items
        if (workspaces.length > 0) {
          workspace = await select({
            message: 'Select a workspace',
            options: workspaces.map((ws: any) => ({
              value: ws.slug,
              label: `${ws.name} (${ws.slug})`
            }))
          })
        } else {
          Logger.info('No workspaces found. Please create one first.')
          workspace = await text({
            message: 'Enter the workspace slug'
          })
        }
      } else {
        this.logError(error)
        workspace = await text({
          message: 'Enter the workspace slug'
        })
      }
    }

    if (!project) {
      const { success, data, error } =
        await ControllerInstance.getInstance().projectController.getAllProjects(
          {
            workspaceSlug: workspace as string
          },
          this.headers
        )

      if (success) {
        const projects = data.items
        if (projects.length > 0) {
          const selectedProjectSlug = await select({
            message: 'Select a project',
            options: projects.map((p: any) => ({
              value: p.slug,
              label: `${p.name} (${p.slug})`
            }))
          })
          project = selectedProjectSlug

          if (!privateKey) {
            const {
              success: projectSuccess,
              data: projectData,
              error: projectError
            } = await ControllerInstance.getInstance().projectController.getProject(
              {
                projectSlug: project as string
              },
              this.headers
            )

            if (projectSuccess && projectData.privateKey) {
              privateKey = projectData.privateKey
            } else if (!projectSuccess) {
              this.logError(projectError)
            }
          }
        } else {
          Logger.info('No projects found in this workspace.')
          project = await text({
            message: 'Enter the project slug'
          })
        }
      } else {
        this.logError(error)
        project = await text({
          message: 'Enter the project slug'
        })
      }
    }

    if (!privateKey) {
      note('Project private key is not stored in database')
      privateKey = await text({
        message: 'Enter the private key'
      })
    }

    if (!environment) {
      const { success, data, error } =
        await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
          {
            projectSlug: project as string
          },
          this.headers
        )

      if (success) {
        const environments = data.items
        if (environments.length > 0) {
          environment = await select({
            message: 'Select an environment',
            options: environments.map((e: any) => ({
              value: e.slug,
              label: `${e.name} (${e.slug})`
            }))
          })
        } else {
          Logger.info('No environments found in this project.')
          environment = await text({
            message: 'Enter the environment slug'
          })
        }
      } else {
        this.logError(error)
        environment = await text({
          message: 'Enter the environment slug'
        })
      }
    }

    if (!overwrite) await this.checkOverwriteExistingProjectConfig()

    await writeProjectRootConfig({
      workspace,
      project,
      environment,
      quitOnDecryptionFailure
    })

    await writePrivateKeyConfig({
      [project]: privateKey
    })

    outro('Project configured successfully')
  }

  private async checkOverwriteExistingProjectConfig(): Promise<void> {
    if (existsSync('./keyshade.json')) {
      const overwrite = await confirm({
        message: 'Configuration already exists. Do you want to overwrite it?'
      })

      if (!overwrite) {
        outro('Configuration cancelled')
      }
    }
  }
}
