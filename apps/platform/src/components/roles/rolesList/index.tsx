import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import RoleCard from '../roleCard'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { rolesOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import ErrorCard from '@/components/shared/error-card'

type ErrorMessage = { header: string; body: string } | null

function RoleListItemSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-4 items-center justify-between gap-x-10">
      <div className="h-5 w-8/12 rounded-full bg-white/5" />
      <div className="h-5 w-6/12 rounded-full bg-white/5" />
      <div className="h-5 w-7/12 rounded-full bg-white/5" />
      <div className="h-5 w-8/12 rounded-full bg-white/5" />
    </div>
  )
}

export default function RoleList(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [roles, setRoles] = useAtom(rolesOfWorkspaceAtom)
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(null)

  const getAllRolesOfWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.getWorkspaceRolesOfWorkspace(
      {
        workspaceSlug: selectedWorkspace!.slug
      }
    )
  )

  useEffect(() => {
    if (selectedWorkspace) {
      getAllRolesOfWorkspace()
        .then(({ data, success, error }) => {
          if (success && data) {
            setRoles(data.items)
          }
          if (error) {
            const errorMsg = error.message
            const parsedError = JSON.parse(errorMsg) as ErrorMessage
            setErrorMessage(parsedError)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [getAllRolesOfWorkspace, selectedWorkspace, setRoles])

  return loading ? (
    <div className="flex animate-pulse flex-col gap-y-4">
      <div className="mb-3 h-[3.125rem] w-full rounded-lg bg-white/5" />
      <RoleListItemSkeleton />
      <RoleListItemSkeleton />
      <RoleListItemSkeleton />
    </div>
  ) : roles.length === 0 ? (
    <ErrorCard description={errorMessage?.body} header={errorMessage?.header} />
  ) : (
    <Table className="h-full w-full">
      <TableHeader className="h-[3.125rem] w-full">
        <TableRow className="h-full w-full bg-white/10 ">
          <TableHead className="h-full w-2/12 rounded-tl-xl text-base font-normal text-white/50">
            Name
          </TableHead>
          <TableHead className="h-full w-2/12 text-base font-normal text-white/50">
            Member(s)
          </TableHead>
          <TableHead className="h-full w-4/12 text-base font-normal text-white/50">
            Permissions
          </TableHead>
          <TableHead className="h-full w-2/12 text-base font-normal text-white/50" />
          <TableHead className="h-full w-1/12 rounded-tr-xl text-base font-normal text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((value) => (
          <RoleCard key={value.id} role={value} />
        ))}
      </TableBody>
    </Table>
  )
}
