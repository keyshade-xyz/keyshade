import React from 'react'
import { TableCell , TableRow } from '../ui/table'
import { Skeleton } from '../ui/skeleton'

function TableLoader() {
  return (
    <>
      {['loader-row-1', 'loader-row-2', 'loader-row-3'].map((key) => (
        <TableRow className="border-b-0 hover:bg-transparent" key={key}>
          <TableCell colSpan={4}>
            <Skeleton className="h-10 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default TableLoader
