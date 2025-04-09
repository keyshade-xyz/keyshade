import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    metadata?: { totalCount: number }
  }
  error?: { message: string }
}

interface PaginatedListProps<T> {
  itemKey: (item: T) => string | number
  itemComponent: (item: T) => React.ReactNode
  itemsPerPage: number
  fetchFunction: (params: {
    page: number
    limit: number
  }) => Promise<PaginatedResponse<T>>
  className?: string
}

export function PaginatedList<T>({
  itemKey,
  itemComponent,
  itemsPerPage,
  fetchFunction,
  className = ''
}: PaginatedListProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)
  const loadingRef = useRef(false)
  const observer = useRef<IntersectionObserver | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return

    loadingRef.current = true
    setLoading(true)

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
      if (!success) throw new Error(err?.message || 'Fetch failed')

      const fetched = data.items
      const total = data.metadata?.totalCount ?? 0

      setItems((prev) => {
        const newItems = fetched.filter((item) => {
          return !prev.some((x) => itemKey(x) === itemKey(item))
        })
        const countAfter = prev.length + newItems.length
        const more = newItems.length > 0 && countAfter < total

        hasMoreRef.current = more
        if (more) pageRef.current = currentPage + 1

        return [...prev, ...newItems]
      })

      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      hasMoreRef.current = false
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [fetchFunction, itemsPerPage, itemKey])

  useEffect(() => {
    setItems([])
    setError(null)
    pageRef.current = 0
    hasMoreRef.current = true
    loadingRef.current = false

    loadData()
  }, [fetchFunction, itemsPerPage, loadData])

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

  if (loading && items.length === 0) {
    return <div className="flex justify-center p-4">Loading...</div>
  }
  if (error && items.length === 0) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>
  }
  if (items.length === 0) {
    return <div className="p-4 text-center text-gray-500">No items found</div>
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

      {loading && items.length > 0 ? (
        <div className="flex justify-center p-4">
          <div className="text-sm text-white/70">Loading more…</div>
        </div>
      ) : null}
    </div>
  )
}
