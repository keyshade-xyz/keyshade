import { Environment, Project } from '@prisma/client'

export interface EnvironmentWithProject extends Environment {
  project: Project
}
