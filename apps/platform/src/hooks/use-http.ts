import type { ClientResponse } from '@keyshade/schema'
import { createElement, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import { logout } from '@/lib/utils'

function handle403() {
  toast.info('Session expired', {
    description: 'Session expired. Please sign in again.'
  })

  logout()
}

function handle500(error) {
  toast.error('Something went wrong on our end')
  Sentry.captureException(error)
}

export function useHttp<T, V extends ClientResponse<T>>(
  fn: () => Promise<V>
): () => Promise<V> {
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  return useCallback(async (): Promise<V> => {
    try {
      const response = await fnRef.current()

      if (response.error) {
        const statusCode = response.error.statusCode

        if (statusCode === 403) {
          handle403()
        } else if (statusCode.toString().startsWith('4')) {
          // For 4xx errors
          try {
            const { header, body } = JSON.parse(response.error.message) as {
              header: string
              body: string
            }

            toast.error(header, {
              description: createElement(
                'p',
                { className: 'text-xs text-red-300' },
                body
              )
            })
          } catch (error) {
            toast.error('Faced an error processing your request', {
              description: createElement(
                'p',
                { className: 'text-xs text-red-300' },
                response.error.message
              )
            })
          }
        } else if (statusCode === 500) {
          handle500(response.error)
        }
      }
      return response
    } catch (error) {
      if (error.status === 403) {
        handle403()
      } else if (error.status === 500) {
        handle500(error)
      }
      throw error
    }
  }, [])
}
