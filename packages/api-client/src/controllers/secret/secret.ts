import client from '../../client'

export default class SecretController {
  private static apiClient = client

  static async createSecret() {}
  static async updateSecret() {}
  static async rollbackSecret() {}
  static async deleteSecret() {}
  static async getAllSecretsOfProject() {}
  static async getAllSecretsOfEnvironment() {}
}
