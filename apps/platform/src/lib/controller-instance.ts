import {
  AuthController,
  EnvironmentController,
  EventController,
  IntegrationController,
  PaymentController,
  ProjectController,
  SecretController,
  UserController,
  VariableController,
  WorkspaceController,
  WorkspaceMembershipController,
  WorkspaceRoleController
} from '@keyshade/api-client'

export default class ControllerInstance {
  private static instance: ControllerInstance | null

  private _authController: AuthController

  get authController(): AuthController {
    return this._authController
  }

  private _userController: UserController

  get userController(): UserController {
    return this._userController
  }

  private _workspaceController: WorkspaceController

  get workspaceController(): WorkspaceController {
    return this._workspaceController
  }

  private _workspaceMembershipController: WorkspaceMembershipController

  get workspaceMembershipController(): WorkspaceMembershipController {
    return this._workspaceMembershipController
  }

  private _workspaceRoleController: WorkspaceRoleController

  get workspaceRoleController(): WorkspaceRoleController {
    return this._workspaceRoleController
  }

  private _projectController: ProjectController

  get projectController(): ProjectController {
    return this._projectController
  }

  private _environmentController: EnvironmentController

  get environmentController(): EnvironmentController {
    return this._environmentController
  }

  private _secretController: SecretController

  get secretController(): SecretController {
    return this._secretController
  }

  private _variableController: VariableController

  get variableController(): VariableController {
    return this._variableController
  }

  private _integrationController: IntegrationController

  get integrationController(): IntegrationController {
    return this._integrationController
  }

  private _eventController: EventController

  get eventController(): EventController {
    return this._eventController
  }

  private _paymentController: PaymentController

  get paymentController(): PaymentController {
    return this._paymentController
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
      ControllerInstance.instance._integrationController =
        new IntegrationController(process.env.NEXT_PUBLIC_BACKEND_URL)
      ControllerInstance.instance._eventController = new EventController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
      ControllerInstance.instance._paymentController = new PaymentController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )
    }
    return ControllerInstance.instance
  }
}
