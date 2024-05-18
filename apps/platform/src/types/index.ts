import { z } from 'zod'

export const zUser = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().or(z.null()),
  profilePictureUrl: z.string().url().or(z.null()),
  isActive: z.boolean(),
  isOnboardingFinished: z.boolean(),
  isAdmin: z.boolean(),
  authProvider: z.string(),
})

export type User = z.infer<typeof zUser>
