import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    metadata?: {
      totalCount: number
    }
  }
  error?: {
    message: string
  }
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
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const effectiveLimit = page * itemsPerPage
        const response = await fetchFunction({
          page: 1,
          limit: effectiveLimit
        })

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch data')
        }

        const fetchedItems = response.data.items
        setItems(fetchedItems)

        const total = response.data.metadata?.totalCount || fetchedItems.length
        setTotalItems(total)
        setTotalPages(Math.ceil(total / itemsPerPage))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, itemsPerPage, fetchFunction])

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1)
    }
  }

  if (loading && items.length === 0) {
    return (
      <div>
        <div className="flex justify-center p-4">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="p-4 text-center text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="p-4 text-center text-gray-500">No items found</div>
      </div>
    )
  }

  return (
    <div>
      <div className={cn(className)}>
        {items.map((item) => (
          <div key={itemKey(item)}>{itemComponent(item)}</div>
        ))}
      </div>
      <div className="mx-4 mt-4 flex items-center justify-between">
        <span className="mb-2 text-sm text-white/70">
          Showing {items.length} of {totalItems}
        </span>
        {page < totalPages && (
          <Button
            className="rounded border px-3 py-1"
            disabled={loading}
            onClick={handleLoadMore}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>
    </div>
  )
}
