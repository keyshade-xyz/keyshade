import {
  EnvironmentController,
  EventController,
  IntegrationController,
  ProjectController,
  SecretController,
  VariableController,
  WorkspaceController,
  WorkspaceRoleController
} from '@keyshade/api-client'

export default class ControllerInstance {
  private static instance: ControllerInstance | null

  private _environmentController: EnvironmentController | null = null

  get environmentController(): EnvironmentController {
    if (!this._environmentController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._environmentController
  }

  private _eventController: EventController | null = null

  get eventController(): EventController {
    if (!this._eventController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._eventController
  }

  private _integrationController: IntegrationController | null = null

  get integrationController(): IntegrationController {
    if (!this._integrationController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._integrationController
  }

  private _projectController: ProjectController | null = null

  get projectController(): ProjectController {
    if (!this._projectController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._projectController
  }

  private _secretController: SecretController | null = null

  get secretController(): SecretController {
    if (!this._secretController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._secretController
  }

  private _variableController: VariableController | null = null

  get variableController(): VariableController {
    if (!this._variableController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._variableController
  }

  private _workspaceController: WorkspaceController | null = null

  get workspaceController(): WorkspaceController {
    if (!this._workspaceController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._workspaceController
  }

  private _workspaceRoleController: WorkspaceRoleController | null = null

  get workspaceRoleController(): WorkspaceRoleController {
    if (!this._workspaceRoleController) {
      throw new Error('ControllerInstance not initialized')
    }
    return this._workspaceRoleController
  }

  static initialize(baseUrl: string) {
    if (!ControllerInstance.instance) {
      const instance = new ControllerInstance()

      instance._environmentController = new EnvironmentController(baseUrl)
      instance._eventController = new EventController(baseUrl)
      instance._integrationController = new IntegrationController(baseUrl)
      instance._projectController = new ProjectController(baseUrl)
      instance._secretController = new SecretController(baseUrl)
      instance._variableController = new VariableController(baseUrl)
      instance._workspaceController = new WorkspaceController(baseUrl)
      instance._workspaceRoleController = new WorkspaceRoleController(baseUrl)

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
