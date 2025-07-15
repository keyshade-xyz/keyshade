export interface ChangeNotifierRegistration {
  workspaceSlug: string
  projectSlug: string
  environmentSlug: string
}

export interface ChangeNotification {
  name: string
  value: string
}

export interface ChangeNotificationEvent extends ChangeNotification {
  environmentId: string
}
