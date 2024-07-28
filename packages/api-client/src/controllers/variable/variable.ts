import client from '@package/client'

export default class VariableController {
  private static apiClient = client

  static async createVariable() {}
  static async updateVariable() {}
  static async rollbackVariable() {}
  static async deleteVariable() {}
  static async getAllVariablesOfProject() {}
  static async getAllVariablesOfEnvironment() {}
}
