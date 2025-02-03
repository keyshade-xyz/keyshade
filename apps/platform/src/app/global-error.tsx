'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string }
}) {
  const router = useRouter()

  useEffect(() => {
    try {
      // Trying to parse error messages sent from failed API Client calls
      const {
        statusCode
      }: {
        statusCode: number
      } = JSON.parse(error.message)

      if (statusCode === 403) {
        // Clear cookies
        document.cookie =
          'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
        document.cookie =
          'isOnboardingFinished=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

        // Redirect to sign in
        router.push('/auth')

        toast.info('Authentication expired', {
          description: (
            <p className="text-xs text-red-300">
              Authentication expired. Please sign in again.
            </p>
          )
        })

        return
      } else if (statusCode.toString().startsWith('4')) {
        const { header, body } = JSON.parse(error.message).error
        // For 4xx errors
        toast.error(header, {
          description: <p className="text-xs text-red-300">{body}</p>
        })

        return
      } else if (statusCode.toString().startsWith('5')) {
        // For 5xx errors
        toast.error("It's us, not you", {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong on our end. Our team has been reported of
              this error.
            </p>
          )
        })

        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    } catch (e) {
      /* empty */
    }

    Sentry.captureException(error)
  }, [error, router])

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
