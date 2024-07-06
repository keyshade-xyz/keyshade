import { EnvironmentCommand } from '../command.interface'
import { EnvironmentController } from 'src/http/project'

export class EnvironmentCommandImpl implements EnvironmentCommand {
  private controller: EnvironmentController

  constructor() {
    this.controller = new EnvironmentController()
  }

  async list(projectId: string): Promise<void> {
    const environments = await this.controller.listEnvironments(projectId)
    console.log(environments)
  }

  async get(environmentId: string): Promise<void> {
    const environment = await this.controller.getEnvironment(environmentId)
    console.log(environment)
  }

  async create(projectId: string): Promise<void> {
    const newEnvironment = await this.controller.createEnvironment(projectId)
    console.log(newEnvironment)
  }

  async update(environmentId: string): Promise<void> {
    const updatedEnvironment = await this.controller.updateEnvironment(environmentId)
    console.log(updatedEnvironment)
  }

  async delete(environmentId: string): Promise<void> {
    await this.controller.deleteEnvironment(environmentId)
    console.log(`Environment ${environmentId} deleted successfully.`)
  }
}
