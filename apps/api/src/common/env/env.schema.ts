import { z } from 'zod'

/* 

Apparently zod validates empty strings. 

https://github.com/colinhacks/zod/issues/2466

So if you have your variable in the .env set to empty, zod turns a blind eye to it since it parses to 

VARIABLE = ''

To over come this you need to set a min length if you want zod to throw an error

Zod only throws errors if a variable is missing completely from .env

Use the .optional() property if you are okay with a variable being omitted from .env file

*/

export const EnvSchema = z.object({
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

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_EMAIL_ADDRESS: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  // TODO: add regex check for FORM_EMAIL value as represented in .env.example (your-name <your-name@email.com>)
  FROM_EMAIL: z.string(),

  JWT_SECRET: z.string(),

  WEB_FRONTEND_URL: z.string().url(),
  WORKSPACE_FRONTEND_URL: z.string().url()
})
