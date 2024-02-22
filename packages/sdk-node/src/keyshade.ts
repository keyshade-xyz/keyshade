export default class keyshade {
  private static instance: keyshade | null = null
  private apiKey: string

  private constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  public static getInstance(apiKey: string): keyshade {
    if (!this.instance) {
      this.instance = new keyshade(apiKey)
    }
    return this.instance
  }

  public createProject(projectName: string, privateKey: string) {
    console.log(
      `Creating project ${projectName} with private key ${privateKey}`
    )

    return {
      update: () => {},
      delete: () => {},
      getAllSecrets: () => {},
      createSecret: () => {},
      getSecret: () => {},
      resolveSecret: () => {},
      resolveSecrets: () => {}
    }
  }

  public static updateSecret() {}
  public static deleteSecret() {}
  public static getAllSecrets() {}
  public static getSecret() {}
  public static resolveSecret() {}
  public static resolveSecrets() {}
}
