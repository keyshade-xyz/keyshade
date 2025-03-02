import { z } from 'zod'
import {
  VariableSchema,
  CreateVariableRequestSchema,
  CreateVariableResponseSchema,
  UpdateVariableRequestSchema,
  UpdateVariableResponseSchema,
  RollBackVariableRequestSchema,
  RollBackVariableResponseSchema,
  DeleteVariableRequestSchema,
  DeleteVariableResponseSchema,
  GetAllVariablesOfProjectRequestSchema,
  GetAllVariablesOfProjectResponseSchema,
  GetRevisionsOfVariableRequestSchema,
  GetRevisionsOfVariableResponseSchema,
  GetAllVariablesOfEnvironmentRequestSchema,
  GetAllVariablesOfEnvironmentResponseSchema
} from '.'

export type Variable = z.infer<typeof VariableSchema>

export type CreateVariableRequest = z.infer<typeof CreateVariableRequestSchema>

export type CreateVariableResponse = z.infer<
  typeof CreateVariableResponseSchema
>

export type UpdateVariableRequest = z.infer<typeof UpdateVariableRequestSchema>

export type UpdateVariableResponse = z.infer<
  typeof UpdateVariableResponseSchema
>

export type RollBackVariableRequest = z.infer<
  typeof RollBackVariableRequestSchema
>

export type RollBackVariableResponse = z.infer<
  typeof RollBackVariableResponseSchema
>

export type DeleteVariableRequest = z.infer<typeof DeleteVariableRequestSchema>

export type DeleteVariableResponse = z.infer<
  typeof DeleteVariableResponseSchema
>

export type GetAllVariablesOfProjectRequest = z.infer<
  typeof GetAllVariablesOfProjectRequestSchema
>

export type GetAllVariablesOfProjectResponse = z.infer<
  typeof GetAllVariablesOfProjectResponseSchema
>

export type GetRevisionsOfVariableRequest = z.infer<
  typeof GetRevisionsOfVariableRequestSchema
>

export type GetRevisionsOfVariableResponse = z.infer<
  typeof GetRevisionsOfVariableResponseSchema
>

export type GetAllVariablesOfEnvironmentRequest = z.infer<
  typeof GetAllVariablesOfEnvironmentRequestSchema
>

export type GetAllVariablesOfEnvironmentResponse = z.infer<
  typeof GetAllVariablesOfEnvironmentResponseSchema
>
