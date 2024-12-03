import { z } from 'zod'

export const zUser = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  profilePictureUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  isOnboardingFinished: z.boolean(),
  isAdmin: z.boolean(),
  authProvider: z.string()
})

export type User = z.infer<typeof zUser>
