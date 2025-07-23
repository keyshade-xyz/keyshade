import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import ErrorCard from '../shared/error-card'
import { cn } from '@/lib/utils'

interface InfiniteScrollListResponse<T> {
  success: boolean
  data: {
    items: T[]
    metadata?: { totalCount: number }
  }
  error?: { message: string }
}
type ErrorMessage = { header: string; body: string } | null

interface InfiniteScrollListProps<T> {
  itemKey: (item: T) => string | number
  itemComponent: (item: T) => React.ReactNode
  itemsPerPage: number
  fetchFunction: (params: {
    page: number
    limit: number
  }) => Promise<InfiniteScrollListResponse<T>>
  className?: string
  inTable?: boolean
}

export function InfiniteScrollList<T>({
  itemKey,
  itemComponent,
  itemsPerPage,
  fetchFunction,
  className = '',
  inTable = false
}: InfiniteScrollListProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(null)

  const pageRef = useRef<number>(0)
  const hasMoreRef = useRef<boolean>(true)
  const loadingRef = useRef<boolean>(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return

    loadingRef.current = true
    setIsLoading(true)

    try {
      const currentPage = pageRef.current
      const {
        success,
        data,
        error: err
      } = await fetchFunction({
        page: currentPage,
        limit: itemsPerPage
      })
      if (!success && err) {
        const errorMsg = err.message
        const parsedError = JSON.parse(errorMsg) as ErrorMessage
        setErrorMessage(parsedError)
        return
      }
      const fetched = data.items
      const total = data.metadata?.totalCount ?? 0

      setItems((prev) => {
        const newItems = fetched.filter((item) => {
          return !prev.some((x) => itemKey(x) === itemKey(item))
        })
        const countAfter = prev.length + newItems.length
        const more = countAfter < total

        hasMoreRef.current = more
        if (more) pageRef.current = currentPage + 1

        return [...prev, ...newItems]
      })
      setErrorMessage(null)
    } catch (e) {
      hasMoreRef.current = false
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [fetchFunction, itemsPerPage, itemKey])

  useEffect(() => {
    setItems([])
    setErrorMessage(null)
    pageRef.current = 0
    hasMoreRef.current = true
    loadingRef.current = false

    loadData()
  }, [loadData])

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMoreRef.current &&
            !loadingRef.current
          ) {
            loadData()
          }
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0.1
        }
      )
      if (node) observer.current.observe(node)
    },
    [loadData]
  )

  if (isLoading && items.length === 0) {
    return inTable ? (
      <tr>
        <td className="flex justify-center p-4" colSpan={3}>
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        </td>
      </tr>
    ) : (
      <div className="flex justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-white/70" />
      </div>
    )
  }
  if (errorMessage && items.length === 0) {
    return (
      <ErrorCard description={errorMessage.body} header={errorMessage.header} />
    )
  }
  if (items.length === 0) {
    return inTable ? (
      <tr>
        <td className="p-4 text-center text-gray-500" colSpan={3}>
          No items found
        </td>
      </tr>
    ) : (
      <div className="p-4 text-center text-gray-500">No items found</div>
    )
  }

  if (inTable) {
    return (
      <>
        {items.map((item, i) => (
          <React.Fragment key={itemKey(item)}>
            {itemComponent(item)}
            {i === items.length - 1 && hasMoreRef.current ? (
              <tr>
                <td colSpan={3} ref={lastItemRef} />
              </tr>
            ) : null}
          </React.Fragment>
        ))}
        {isLoading ? (
          <tr>
            <td className="flex justify-center p-4" colSpan={3}>
              <Loader2 className="h-5 w-5 animate-spin text-white/70" />
            </td>
          </tr>
        ) : null}
      </>
    )
  }
  return (
    <div className={cn(className)} ref={containerRef}>
      {items.map((item, i) => (
        <div
          key={itemKey(item)}
          ref={i === items.length - 1 ? lastItemRef : null}
        >
          {itemComponent(item)}
        </div>
      ))}

      {isLoading && items.length > 0 ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        </div>
      ) : null}
    </div>
  )
}
