import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
import { TrashSVG } from '@public/svg/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  deleteRoleOpenAtom,
  rolesOfWorkspaceAtom,
  selectedRoleAtom,
  workspaceRolesCountAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

function ConfirmDeleteRole() {
  const [selectedRole, setSelectedRole] = useAtom(selectedRoleAtom)
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useAtom(deleteRoleOpenAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)
  const setWorkspaceRolesCount = useSetAtom(workspaceRolesCountAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const deleteRole = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.deleteWorkspaceRole(
      {
        workspaceRoleSlug: selectedRole!.slug
      }
    )
  )

  const handleClose = useCallback(() => {
    setIsDeleteRoleOpen(false)
  }, [setIsDeleteRoleOpen])

  const handleDeleteRole = useCallback(async () => {
    if (selectedRole) {
      setIsLoading(true)
      toast.loading('Deleting role...')

      try {
        const { success } = await deleteRole()

        if (success) {
          setWorkspaceRolesCount((prev) => prev - 1)
          toast.success('Role deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The role has been deleted.
              </p>
            )
          })

          // Remove the role from the store
          setRoles((prevRoles) =>
            prevRoles.filter((role) => role.slug !== selectedRole.slug)
          )
          setSelectedRole(null)
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
        setSelectedRole(null)
        handleClose()
      }
    }
  }, [
    selectedRole,
    deleteRole,
    setRoles,
    setSelectedRole,
    handleClose,
    setWorkspaceRolesCount
  ])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isDeleteRoleOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isDeleteRoleOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isDeleteRoleOpen}
      onOpenChange={handleClose}
      open={isDeleteRoleOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete {selectedRole?.name}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your role
            and remove your role data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={isLoading}
            onClick={handleDeleteRole}
          >
            Yes, delete {selectedRole?.name}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDeleteRole
