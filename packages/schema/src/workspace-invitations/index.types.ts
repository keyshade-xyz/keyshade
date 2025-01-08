import { z } from 'zod'
import {
  GetWorkspaceInvitationsRequestSchema,
  GetWorkspaceInvitationsResponseSchema
} from './'

export type GetWorkspaceInvitationsRequest = z.infer<
  typeof GetWorkspaceInvitationsRequestSchema
>
export type GetWorkspaceInvitationsResponse = z.infer<
  typeof GetWorkspaceInvitationsResponseSchema
>
