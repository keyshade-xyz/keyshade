import { Command } from 'commander'
import BaseCommand from '../base/command.interface'
import Logger from 'src/util/logger'
import ProjectController from 'src/http/project'
import { ProjectData } from './project.types'

export default class ProjectCommand implements BaseCommand {
  prepareCommand(program: Command): void {
    program
      .command('project list <workspaceId>')
      .description('List all projects under a workspace')
      .helpCommand('-h, --help', 'Display this help message')
      .action((workspaceId) => {
        this.listProjects(workspaceId)
      })

    program
      .command('project get <projectId>')
      .description('Get a particular project by id')
      .helpCommand('-h, --help', 'Display this help message')
      .action((projectId) => {
        this.getProject(projectId)
      })

    program
      .command('project create <workspaceId>')
      .description('Create a project')
      .helpCommand('-h, --help', 'Display this help message')
      .action((workspaceId) => {
        this.createProject(workspaceId)
      })

    program
      .command('project update <projectId>')
      .description('Edit a project')
      .helpCommand('-h, --help', 'Display this help message')
      .action((projectId) => {
        this.updateProject(projectId)
      })

    program
      .command('project delete <projectId>')
      .description('Delete a project')
      .helpCommand('-h, --help', 'Display this help message')
      .action((projectId) => {
        this.deleteProject(projectId)
      })

    program
      .command('project fork <parentProjectId>')
      .description('Fork a project')
      .helpCommand('-h, --help', 'Display this help message')
      .option('--unlink', 'Unlink fork parent')
      .option('--sync', 'sync a fork')
      .option('--hard-sync', 'Hard sync a fork')
      .action((parentProjectId) => {
        this.forkProject(parentProjectId)
      })
  }

  private async listProjects(workspaceId: string) {
    Logger.info(`Fetching projects from workspace: ${workspaceId}`)
    const response = await ProjectController.listProjects(
      'baseurl',
      'apikey',
      workspaceId
    )
    response.forEach((project, index) => {
      Logger.log(`Project ${index + 1}: ${JSON.stringify(project)}`)
    })
  }

  private async getProject(projectId: string) {
    Logger.info(`Fetching project: ${projectId}`)
    const response = await ProjectController.getProject(
      'baseurl',
      'apikey',
      projectId
    )
    Logger.log(JSON.stringify(response))
  }

  private async createProject(workspaceId: string) {
    // need to correct this
    let projectData: ProjectData
    Logger.info(`creating the project`)
    const response = await ProjectController.createProject(
      'baseurl',
      'apikey',
      workspaceId,
      projectData
    )
    Logger.log(JSON.stringify(response))
  }

  private async updateProject(projectId: string) {}

  private async deleteProject(projectId: string) {}

  private async forkProject(projectId: string) {}
}
