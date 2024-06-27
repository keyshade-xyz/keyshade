export interface ChangeNotifierRegistration {
  workspaceName: string
  projectName: string
  environmentName: string
}

export interface ClientRegisteredResponse {
  workspaceId: string
  projectId: string
  environmentId: string
}

export interface ChangeNotification {
  name: string
  value: string
  isPlaintext: boolean
}

export interface ChangeNotificationEvent extends ChangeNotification {
  environmentId: string
}
