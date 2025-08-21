import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export default function TabelLoader() {
  return (
    <TableRow>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-[15rem] bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-[9rem] bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-[8rem] bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-[5rem] bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-[3rem] bg-white/15" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-4 w-[2rem] bg-white/15" />
      </TableCell>
    </TableRow>
  )
}
