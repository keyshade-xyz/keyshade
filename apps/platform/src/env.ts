import { type TypeOf, z } from 'zod'

const sampleRateSchema = (name: string) =>
  z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : parseFloat(val)))
    .pipe(z.number().min(0).max(1).optional())
    .refine((val) => val === undefined || !isNaN(val), {
      message: `${name} must be a number between 0 and 1`
    })

const zodEnv = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_PLATFORM_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_PLATFORM_PROFILE_SAMPLE_RATE: sampleRateSchema(
    'NEXT_PUBLIC_SENTRY_PLATFORM_PROFILE_SAMPLE_RATE'
  ),
  NEXT_PUBLIC_SENTRY_PLATFORM_TRACES_SAMPLE_RATE: sampleRateSchema(
    'NEXT_PUBLIC_SENTRY_PLATFORM_TRACES_SAMPLE_RATE'
  ),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string()
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- we need to extend the global namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface -- we need to extend the global namespace
    interface ProcessEnv extends TypeOf<typeof zodEnv> {}
  }
}

try {
  zodEnv.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    const { fieldErrors } = error.flatten()
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('\n  ')
    throw new Error(
      `Missing environment variables: \n  ${errorMessage}\n  Please check your .env file.`
    )
  }
}
