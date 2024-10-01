import { z } from 'zod'

/* 

Apparently zod validates empty strings. 

https://github.com/colinhacks/zod/issues/2466

So if you have your variable in the .env set to empty, zod turns a blind eye to it since it parses to 

VARIABLE = ''

To over come this you need to set a min length (.min()) if you want zod to throw an error

Zod only throws errors if a variable is missing completely from .env

Use the .optional() property if you are okay with a variable being omitted from .env file

*/

const sampleRateSchema = (name: string) =>
  z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : parseFloat(val)))
    .pipe(z.number().min(0).max(1).optional())
    .refine((val) => val === undefined || !isNaN(val), {
      message: `${name} must be a number between 0 and 1`
    })

const e2eEnvSchema = z.object({
  NODE_ENV: z.literal('e2e'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string()
})

const devSchema = z.object({
  NODE_ENV: z.literal('dev'),
  DATABASE_URL: z.string(),
  ADMIN_EMAIL: z.string().email(),

  REDIS_URL: z.string(),
  REDIS_PASSWORD: z.string().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),

  API_PORT: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional(),
  GITLAB_CALLBACK_URL: z.string().optional(),

  SENTRY_DSN: z
    .string()
    .url({ message: 'SENTRY_DSN must be a valid URL' })
    .optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: sampleRateSchema('SENTRY_TRACES_SAMPLE_RATE'),
  SENTRY_PROFILES_SAMPLE_RATE: sampleRateSchema('SENTRY_PROFILES_SAMPLE_RATE'),
  SENTRY_ENV: z.string().optional(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_EMAIL_ADDRESS: z.string().email(),
  SMTP_PASSWORD: z.string(),
  FROM_EMAIL: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+-]+(?: [a-zA-Z0-9._%+-]+)* <[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>$/
    ),

  JWT_SECRET: z.string(),

  WEB_FRONTEND_URL: z.string().url(),
  PLATFORM_FRONTEND_URL: z.string().url(),
  PLATFORM_OAUTH_SUCCESS_REDIRECT_PATH: z.string(),
  PLATFORM_OAUTH_FAILURE_REDIRECT_PATH: z.string(),

  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET_NAME: z.string().optional(),
  MINIO_USE_SSL: z.string().optional(),

  FEEDBACK_FORWARD_EMAIL: z.string().email()
})

const prodSchema = z.object({
  NODE_ENV: z.literal('prod'),
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().email().min(5),

  REDIS_URL: z.string().min(1),
  REDIS_PASSWORD: z.string().min(1),

  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().min(1),

  API_PORT: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().min(1),

  GITLAB_CLIENT_ID: z.string().min(1),
  GITLAB_CLIENT_SECRET: z.string().min(1),
  GITLAB_CALLBACK_URL: z.string().min(1),

  SENTRY_DSN: z
    .string()
    .url({ message: 'SENTRY_DSN must be a valid URL' })
    .min(1),
  SENTRY_ORG: z.string().min(1),
  SENTRY_PROJECT: z.string().min(1),
  SENTRY_TRACES_SAMPLE_RATE: sampleRateSchema('SENTRY_TRACES_SAMPLE_RATE'),
  SENTRY_PROFILES_SAMPLE_RATE: sampleRateSchema('SENTRY_PROFILES_SAMPLE_RATE'),
  SENTRY_ENV: z.string().min(1),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().min(1),
  SMTP_EMAIL_ADDRESS: z.string().email().min(5),
  SMTP_PASSWORD: z.string().min(1),
  FROM_EMAIL: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+-]+(?: [a-zA-Z0-9._%+-]+)* <[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>$/
    ),

  JWT_SECRET: z.string().min(3),

  WEB_FRONTEND_URL: z.string().url().min(1),
  PLATFORM_FRONTEND_URL: z.string().url().min(1),
  PLATFORM_OAUTH_SUCCESS_REDIRECT_PATH: z.string().min(1),
  PLATFORM_OAUTH_FAILURE_REDIRECT_PATH: z.string().min(1),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().min(1),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET_NAME: z.string().min(1),
  MINIO_USE_SSL: z.string().min(1),

  FEEDBACK_FORWARD_EMAIL: z.string().email().min(5)
})

export type EnvSchemaType = z.infer<typeof prodSchema>

export const EnvSchema = z.discriminatedUnion('NODE_ENV', [
  e2eEnvSchema,
  prodSchema,
  devSchema
])
