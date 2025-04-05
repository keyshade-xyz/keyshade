import React, { useCallback, useState, useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { User } from '@keyshade/schema'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  editMemberOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom,
  rolesOfWorkspaceAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface SelectedRoles {
  name: string;
  roleSlug: string;
}

export default function EditMemberDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isEditMemberOpen, setIsEditMemberOpen] = useAtom(editMemberOpenAtom)
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<SelectedRoles[]>([])
  const roles = useAtomValue(rolesOfWorkspaceAtom)

  const toggleRole = (role: SelectedRoles) => {
    setSelectedRoles(prev => {
      const isSelected = prev.some(r => r.roleSlug === role.roleSlug)
      return isSelected
        ? prev.filter(r => r.roleSlug !== role.roleSlug)
        : [...prev, role]
    })
  }

  const editMember = useHttp((userEmail: User['email']) =>
    ControllerInstance.getInstance().workspaceMembershipController.updateMemberRoles({
      workspaceSlug: currentWorkspace!.slug,
      roleSlugs: selectedRoles.map(role => role.roleSlug),
      userEmail
    })
  )

  const handleClose = useCallback(() => {
    setIsEditMemberOpen(false)
  }, [setIsEditMemberOpen])

  const handleEditMember = useCallback(async () => {
    if (selectedMember) {
      const { success } = await editMember()

      try {
        if (success) {
          toast.success('Member edited successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                Role of the member &quot;{selectedMember.user.name}&quot; has been edited.
              </p>
            )
          })

          setSelectedMember(null)
          handleClose()
        }
      } finally {
        toast.dismiss()
      }
    }
  }, [
    editMember,
    handleClose,
    selectedMember,
    setSelectedMember
  ])

  useEffect(() => {
    if (selectedMember) {
      const initialRoles = selectedMember.roles
        .filter(memberRole => roles.some(role => role.slug === memberRole.role.slug))
        .map(memberRole => ({
          name: memberRole.role.name,
          roleSlug: memberRole.role.slug
        }))
      setSelectedRoles(initialRoles)
    }
  }, [selectedMember, roles])

  return (
    <Dialog
      aria-hidden={!isEditMemberOpen}
      onOpenChange={handleClose}
      open={isEditMemberOpen}
    >
      <DialogContent className="rounded-lg border-none bg-zinc-900">
        <DialogHeader>
          <div className="flex flex-col justify-center gap-x-3">
            <DialogTitle className="text-lg font-semibold">
              Edit Member
            </DialogTitle>
            <DialogDescription className="text-sm font-normal leading-5 text-neutral-300">
              Edit an existing member
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Label className="w-20 text-sm font-medium text-white" htmlFor="email">
              Email
            </Label>
            <Input
              className="min-w-64 bg-neutral-700 text-white"
              disabled
              id="email"
              type="email"
              value={selectedMember?.user.email}
            />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-16 flex items-center text-sm font-medium text-white" htmlFor="roles">
              Role(s)
            </Label>
            <div className="flex-1 relative">
              <Button
                className="w-full px-3 py-2 flex items-center justify-between bg-white/5 hover:bg-white/5"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                variant="outline"
              >
                <div className="flex gap-2 items-center flex-1 mr-2">
                  {selectedRoles.length === 0 ? (
                    <span className="text-gray-400">Select roles</span>
                  ) : (
                    <>
                      {selectedRoles.slice(0, 2).map((role) => (
                        <span
                          className="bg-[#3B0764] border-purple-200 text-purple-200 border text-xs px-4 py-2 rounded-full"
                          key={role.roleSlug}
                        >
                          {role.name}
                        </span>
                      ))}
                      {selectedRoles.length > 2 && (
                        <span className="text-[#A5F3FC] text-xs p-2">
                          +{selectedRoles.length - 2} more
                        </span>
                      )}
                    </>
                  )}
                </div>
                <ChevronDown className={`transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} size={16} />
              </Button>

              {isDropdownOpen ? (
                <div className="top-full left-0 right-0 mt-1 bg-zinc-800 rounded-md shadow-lg overflow-hidden z-50">
                  {roles.map((role) => (
                    <Label
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-zinc-700"
                      key={role.id}
                    >
                      <Checkbox
                        checked={selectedRoles.some(r => r.roleSlug === role.slug)}
                        className="mr-2 rounded-sm data-[state=checked]:text-black data-[state=checked]:border-none border-none data-[state=checked]:bg-white bg-gray-400"
                        onCheckedChange={() => toggleRole({ name: role.name, roleSlug: role.slug })}
                      />
                      <span className="text-white">{role.name}</span>
                    </Label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="mt-5 rounded-md bg-neutral-100 text-black hover:bg-neutral-100/80"
            onClick={handleEditMember}
          >
            Edit member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

