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

const e2eEnvSchema = z.object({
  NODE_ENV: z.literal('e2e'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string()
})

const generalSchema = z.object({
  NODE_ENV: z.literal('dev'),
  DATABASE_URL: z.string(),
  ADMIN_EMAIL: z.string(),

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

  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().optional(),
  SENTRY_ENV: z.string().optional(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_EMAIL_ADDRESS: z.string(),
  SMTP_PASSWORD: z.string(),
  FROM_EMAIL: z.string().regex(/^[a-zA-Z0-9._%+-]+ [<][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[>]$/),

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

  FEEDBACK_FORWARD_EMAIL: z.string()
})

export type EnvSchemaType = z.infer<typeof generalSchema>

export const EnvSchema = z.discriminatedUnion('NODE_ENV', [
  e2eEnvSchema,
  generalSchema
])
