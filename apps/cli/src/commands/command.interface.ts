export interface EnvironmentCommand {
  list(projectId: string): Promise<void>
  get(environmentId: string): Promise<void>
  create(projectId: string): Promise<void>
  update(environmentId: string): Promise<void>
  delete(environmentId: string): Promise<void>
}
