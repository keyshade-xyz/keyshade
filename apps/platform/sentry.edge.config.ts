import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://38cb895eebaf068ce5ec6de3b9b6e71a@o4506676494270464.ingest.us.sentry.io/4508642331262976',
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  debug: false
})
