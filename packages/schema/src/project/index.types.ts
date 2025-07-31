import { z } from 'zod'
import {
  ProjectSchema,
  CreateProjectRequestSchema,
  CreateProjectResponseSchema,
  UpdateProjectRequestSchema,
  UpdateProjectResponseSchema,
  DeleteProjectRequestSchema,
  DeleteProjectResponseSchema,
  GetProjectRequestSchema,
  GetProjectResponseSchema,
  ForkProjectRequestSchema,
  ForkProjectResponseSchema,
  SyncProjectRequestSchema,
  SyncProjectResponseSchema,
  UnlinkProjectRequestSchema,
  UnlinkProjectResponseSchema,
  GetForkRequestSchema,
  GetForkResponseSchema,
  GetAllProjectsRequestSchema,
  GetAllProjectsResponseSchema,
  ExportProjectConfigurationRequestSchema,
  ExportProjectConfigurationsResponseSchema
} from '.'

export type Project = z.infer<typeof ProjectSchema>

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>

export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>

export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>

export type UpdateProjectResponse = z.infer<typeof UpdateProjectResponseSchema>

export type DeleteProjectRequest = z.infer<typeof DeleteProjectRequestSchema>

export type DeleteProjectResponse = z.infer<typeof DeleteProjectResponseSchema>

export type GetProjectRequest = z.infer<typeof GetProjectRequestSchema>

export type GetProjectResponse = z.infer<typeof GetProjectResponseSchema>

export type ForkProjectRequest = z.infer<typeof ForkProjectRequestSchema>

export type ForkProjectResponse = z.infer<typeof ForkProjectResponseSchema>

export type SyncProjectRequest = z.infer<typeof SyncProjectRequestSchema>

export type SyncProjectResponse = z.infer<typeof SyncProjectResponseSchema>

export type UnlinkProjectRequest = z.infer<typeof UnlinkProjectRequestSchema>

export type UnlinkProjectResponse = z.infer<typeof UnlinkProjectResponseSchema>

export type GetForkRequest = z.infer<typeof GetForkRequestSchema>

export type GetForkResponse = z.infer<typeof GetForkResponseSchema>

export type GetAllProjectsRequest = z.infer<typeof GetAllProjectsRequestSchema>

export type GetAllProjectsResponse = z.infer<
  typeof GetAllProjectsResponseSchema
>

export type ExportProjectRequest = z.infer<
  typeof ExportProjectConfigurationRequestSchema
>

export type ExportProjectResponse = z.infer<
  typeof ExportProjectConfigurationsResponseSchema
>
