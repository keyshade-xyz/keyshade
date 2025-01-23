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
  SENTRY_CLI_DSN: z.string().url().optional(),
  SENTRY_CLI_PROFILE_SAMPLE_RATE: sampleRateSchema(
    'SENTRY_CLI_PROFILE_SAMPLE_RATE'
  ),
  SENTRY_CLI_TRACES_SAMPLE_RATE: sampleRateSchema(
    'SENTRY_CLI_TRACES_SAMPLE_RATE'
  ),
  SENTRY_ENVIRONMENT: z.string()
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
