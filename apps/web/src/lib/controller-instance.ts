import { ShareSecretController } from '@keyshade/api-client'

export default class ControllerInstance {
  private static instance: ControllerInstance | null

  private _shareSecretController: ShareSecretController

  get shareSecretController(): ShareSecretController {
    return this._shareSecretController
  }

  static getInstance(): ControllerInstance {
    if (!ControllerInstance.instance) {
      ControllerInstance.instance = new ControllerInstance()
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

      ControllerInstance.instance._shareSecretController =
        new ShareSecretController(backendUrl)
    }
    return ControllerInstance.instance
  }
}
