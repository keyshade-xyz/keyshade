import type { ClientResponse } from '@keyshade/schema'
import type { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'

function handle403(router: ReturnType<typeof useRouter>) {
  // Clear cookies
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  document.cookie =
    'isOnboardingFinished=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

  toast.info('Session expired', {
    description: 'Session expired. Please sign in again.'
  })

  router.push('/auth')
}

function handle500(error) {
  toast.error('Something went wrong on our end')
  Sentry.captureException(error)
}

export function useHttp<T, V extends ClientResponse<T>>(
  fn: () => Promise<V>,
  router: ReturnType<typeof useRouter>
): () => Promise<V> {
  return useCallback(async (): Promise<V> => {
    try {
      const response = await fn()

      if (response.error) {
        const statusCode = response.error.statusCode

        if (statusCode === 403) {
          handle403(router)
        } else if (statusCode.toString().startsWith('4')) {
          // For 4xx errors
          const { header, body } = JSON.parse(response.error.message) as {
            header: string
            body: string
          }

          toast.error(header, {
            description: body
          })
        } else if (statusCode === 500) {
          handle500(response.error)
        }
      }
      return response
    } catch (error) {
      if (error.status === 403) {
        handle403(router)
      } else if (error.status === 500) {
        handle500(error)
      }
      throw error
    }
  }, [fn, router])
}
