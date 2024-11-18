import { AuthController } from '@keyshade/api-client'

export default class ControllerInstance {
  private static instance: ControllerInstance | null

  private _authController: AuthController | null = null

  get authController(): AuthController {
    if (!this._authController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._authController
  }

  static initialize(baseUrl: string): void {
    if (!ControllerInstance.instance) {
      const instance = new ControllerInstance()

      instance._authController = new AuthController(baseUrl)

      ControllerInstance.instance = instance
    }
  }

  static getInstance(): ControllerInstance {
    if (!ControllerInstance.instance) {
      throw new Error('ControllerInstance not initialized')
    }
    return ControllerInstance.instance
  }
}
