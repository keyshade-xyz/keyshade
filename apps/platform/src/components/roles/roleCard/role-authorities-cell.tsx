import React, { useState } from 'react'
import type { AuthorityEnum, WorkspaceRole } from '@keyshade/schema'
import { Button } from '@/components/ui/button'
import { TableCell } from '@/components/ui/table'

function AuthorityTile({ authority }: { authority: AuthorityEnum }) {
  const formattedAuthority = authority
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  return (
    <div className="h-fit w-fit rounded-full  bg-cyan-950 px-2 py-1 text-center text-xs text-cyan-200">
      {formattedAuthority}
    </div>
  )
}

interface RoleAuthoritiesCellProps {
  authorities: WorkspaceRole['authorities']
}

const AUTHORITY_DISPLAY_LIMIT = 5

function RoleAuthoritiesCell({ authorities }: RoleAuthoritiesCellProps) {
  const [showAllAuthorities, setShowAllAuthorities] = useState<boolean>(false)
  const hasAuthorities = authorities.length > 0

  return (
    <TableCell className="h-fit">
      <div className="mt-1 flex h-full flex-wrap items-start gap-2">
        {hasAuthorities ? (
          <>
            {authorities
              .slice(0, showAllAuthorities ? authorities.length : 5)
              .map((authority) => (
                <AuthorityTile authority={authority} key={authority} />
              ))}
            {authorities.length > AUTHORITY_DISPLAY_LIMIT ? (
              <Button
                aria-controls="authorities-list"
                aria-expanded={showAllAuthorities}
                className="h-auto w-fit justify-start border-none bg-transparent text-blue-300 underline hover:bg-inherit"
                onClick={() => setShowAllAuthorities(!showAllAuthorities)}
              >
                {showAllAuthorities ? 'Show less' : 'Show more'}
              </Button>
            ) : null}
          </>
        ) : (
          <span className="text-sm text-white/60">
            No authorities available
          </span>
        )}
      </div>
    </TableCell>
  )
}

export default RoleAuthoritiesCell
