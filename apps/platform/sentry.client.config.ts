import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_PLATFORM_DSN,
  tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_PLATFORM_TRACES_SAMPLE_RATE,
  profilesSampleRate:
    process.env.NEXT_PUBLIC_SENTRY_PLATFORM_PROFILE_SAMPLE_RATE,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
})
