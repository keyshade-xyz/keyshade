import axios from 'axios';

export class EnvironmentController {
  async listEnvironments(projectId: string): Promise<any> {
    // list environment api
    let response
    return response.data
  }

  async getEnvironment(environmentId: string): Promise<any> {
    // get environment api
    let response
    return response.data
  }

  async createEnvironment(projectId: string): Promise<any> {
    // create environment api
    let response
    return response.data
  }

  async updateEnvironment(environmentId: string): Promise<any> {
    // update environment api
    let response
    return response.data
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    // delete environment api
  }
}
