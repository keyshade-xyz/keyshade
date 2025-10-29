import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export default function TabelLoader() {
  return (
    <TableRow>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-60 bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-36 bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-32 bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-20 bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-12 bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-8 bg-white/15" />
      </TableCell>
    </TableRow>
  )
}
