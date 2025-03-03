import {
  AuthController,
  EnvironmentController,
  ProjectController,
  SecretController,
  UserController,
  VariableController,
  WorkspaceController,
  WorkspaceMembershipController,
  WorkspaceRoleController,
  ApiKeyController
} from '@keyshade/api-client'

export default class ControllerInstance {
  private static instance: ControllerInstance | null

  private _authController: AuthController
  private _userController: UserController
  private _workspaceController: WorkspaceController
  private _workspaceMembershipController: WorkspaceMembershipController
  private _workspaceRoleController: WorkspaceRoleController
  private _projectController: ProjectController
  private _environmentController: EnvironmentController
  private _secretController: SecretController
  private _variableController: VariableController
  private _apiKeyController: ApiKeyController

  get authController(): AuthController {
    return this._authController
  }

  get workspaceController(): WorkspaceController {
    return this._workspaceController
  }

  get workspaceMembershipController(): WorkspaceMembershipController {
    return this._workspaceMembershipController
  }

  get workspaceRoleController(): WorkspaceRoleController {
    return this._workspaceRoleController
  }

  get projectController(): ProjectController {
    return this._projectController
  }

  get environmentController(): EnvironmentController {
    return this._environmentController
  }

  get secretController(): SecretController {
    return this._secretController
  }

  get variableController(): VariableController {
    return this._variableController
  }

  get userController(): UserController {
    return this._userController
  }

  get apiKeyController(): ApiKeyController {
    return this._apiKeyController
  }

  static getInstance(): ControllerInstance {
    if (!ControllerInstance.instance) {
      ControllerInstance.instance = new ControllerInstance()
      ControllerInstance.instance._authController = new AuthController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
      ControllerInstance.instance._userController = new UserController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
      ControllerInstance.instance._workspaceController =
        new WorkspaceController(process.env.NEXT_PUBLIC_BACKEND_URL)
      ControllerInstance.instance._workspaceMembershipController =
        new WorkspaceMembershipController(process.env.NEXT_PUBLIC_BACKEND_URL)
      ControllerInstance.instance._workspaceRoleController =
        new WorkspaceRoleController(process.env.NEXT_PUBLIC_BACKEND_URL)
      ControllerInstance.instance._projectController = new ProjectController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
      ControllerInstance.instance._environmentController =
        new EnvironmentController(process.env.NEXT_PUBLIC_BACKEND_URL)
      ControllerInstance.instance._secretController = new SecretController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
      ControllerInstance.instance._variableController = new VariableController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
      ControllerInstance.instance._apiKeyController = new ApiKeyController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
    }
    return ControllerInstance.instance
  }
}
