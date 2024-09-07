import { type TypeOf, z } from 'zod'

const zodEnv = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.string().url()
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
