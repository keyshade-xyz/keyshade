export interface ChangeNotifierRegistration {
  workspaceSlug: string
  projectSlug: string
  environmentSlug: string
}

export interface Configuration {
  name: string
  value: string
}

export interface ChangeNotificationEvent extends Configuration {
  environmentId: string
}
