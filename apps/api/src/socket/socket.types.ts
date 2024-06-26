export interface ChangeNotifierRegistration {
  workspaceName: string
  projectName: string
  environmentName: string
}

export interface ChangeNotification {
  name: string
  value: string
  requireRestart: boolean
  isSecret: boolean
}

export interface ChangeNotificationEvent extends ChangeNotification {
  environmentId: string
}
