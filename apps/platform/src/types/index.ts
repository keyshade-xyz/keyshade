import type { Environment, Project } from '@keyshade/schema'

export type PartialProject = Pick<Project, 'id' | 'name' | 'slug'>
export type PartialEnvironment = Pick<Environment, 'id' | 'name' | 'slug'>
export type VercelSystemEnvironment = 'development' | 'preview' | 'production'
