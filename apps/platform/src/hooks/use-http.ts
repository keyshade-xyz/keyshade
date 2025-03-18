/* eslint-disable @typescript-eslint/no-unsafe-argument -- GitHub CI flagging this */

import type { ClientResponse } from '@keyshade/schema'
import { createElement, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import { logout } from '@/lib/utils'

// Add a flag to track if we've already shown the session expired toast
let isHandling403 = false

function handle403() {
  if (isHandling403) return

  isHandling403 = true

  toast.info('Session expired', {
    description: createElement('p', { className: 'text-xs text-blue-300' }, 'Session expired. Please sign in again.')
  })

  logout()

  setTimeout(() => {
    isHandling403 = false
  }, 5000)
}

function handle500(error) {
  toast.error('Something went wrong on our end')
  Sentry.captureException(error)
}

type FunctionArgs = (
  | string
  | number
  | Record<string, string>
  | Record<string, number>
)[]

export function useHttp<T, V extends ClientResponse<T>>(
  fn: (...args: FunctionArgs) => Promise<V>
): (...args: FunctionArgs) => Promise<V> {
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  return useCallback(async (...args: FunctionArgs): Promise<V> => {
    try {
      const response = await fnRef.current(...args)

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
