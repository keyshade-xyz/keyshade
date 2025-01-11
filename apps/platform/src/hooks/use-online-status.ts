import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export const useOnlineStatus = () => {
  const statusTimeout = useRef<NodeJS.Timeout | null>(null)

  const statusHandler = () => {
    if (statusTimeout.current) {
      clearTimeout(statusTimeout.current)
    }

    statusTimeout.current = setTimeout(() => {
      if (navigator.onLine) {
        toast.success('You are back online! Refreshing...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error('You are offline')
      }
    }, 1000)
  }

  useEffect(() => {
    window.addEventListener('online', statusHandler)
    window.addEventListener('offline', statusHandler)

    return () => {
      window.removeEventListener('online', statusHandler)
      window.removeEventListener('offline', statusHandler)
    }
  }, [])
}
