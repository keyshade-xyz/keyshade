import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'

export const InviteMemberResponseSchema = z.object({
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    icon: z.string().nullable()
  }),
  roles: z.array(
    z.object({
      role: z.object({
        name: z.string(),
        colorCode: z.string()
      })
    })
  ),
  inviteOn: z.string().datetime()
})

export const GetWorkspaceInvitationsRequestSchema = PageRequestSchema

export const GetWorkspaceInvitationsResponseSchema = PageResponseSchema(
  InviteMemberResponseSchema
)
