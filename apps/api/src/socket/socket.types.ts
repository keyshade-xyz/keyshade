export interface ChangeNotifierRegistration {
  workspaceSlug: string
  projectSlug: string
  environmentSlug: string
}

export interface ChangeNotification {
  name: string
  value: string
  isPlaintext: boolean
}

export interface ChangeNotificationEvent extends ChangeNotification {
  environmentId: string
}
