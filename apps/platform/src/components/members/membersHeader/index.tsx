'use client'
import { AddSVG } from '@public/svg/shared'
import React, { useCallback, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  rolesOfWorkspaceAtom,
  selectedWorkspaceAtom,
  workspaceMemberCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface SelectedRoles {
  name: string
  roleSlug: string
}

export default function MembersHeader(): React.JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [selectedRoles, setSelectedRoles] = useState<SelectedRoles[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const roles = useAtomValue(rolesOfWorkspaceAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const setMemberCount = useSetAtom(workspaceMemberCountAtom)

  const toggleRole = (role: SelectedRoles): void => {
    setSelectedRoles((prev) => {
      const isSelected = prev.some((r) => r.roleSlug === role.roleSlug)
      if (isSelected) {
        return prev.filter((r) => r.roleSlug !== role.roleSlug)
      }
      return [...prev, role]
    })
  }

  const inviteMember = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.inviteUsers({
      workspaceSlug: currentWorkspace!.slug,
      members: [
        {
          email,
          roleSlugs: selectedRoles.map((role) => role.roleSlug)
        }
      ]
    })
  )

  const handleClose = useCallback(() => {
    setIsDialogOpen(false)
    setIsDropdownOpen(false)
    setEmail('')
    setSelectedRoles([])
  }, [])

  const handleInviteMembers = useCallback(async () => {
    if (email.trim() === '') {
      toast.error('Email is required')
      return
    }

    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role')
      return
    }

    setIsLoading(true)
    toast.loading('Sending invite...')
    try {
      const { success } = await inviteMember()

      if (success) {
        setMemberCount((prev) => prev + 1)
        toast.success('Invite sent successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              Member will be added once they accept the invite.
            </p>
          )
        })
        handleClose()
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }, [email, selectedRoles.length, handleClose, inviteMember, setMemberCount])

  return (
    <div className="flex justify-between">
      <div className="text-3xl font-medium">Members</div>
      <div className="flex gap-x-4">
        <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <AddSVG /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6">
            <DialogHeader className="border-b border-white/20 pb-6 pt-2">
              <DialogTitle>Share this project with new members</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="mb-2 block text-sm font-medium text-white">
                  Email
                </Label>
                <div className="flex flex-row gap-1">
                  <Input
                    className="w-3/4 bg-white/5 text-white outline-none"
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    value={email}
                  />
                  <Button
                    className="w-1/4 border border-white/10 bg-[#262626] px-4 py-2 text-white/55"
                    disabled={isLoading}
                    onClick={handleInviteMembers}
                  >
                    Invite Member
                  </Button>
                </div>
              </div>

              {/* Roles */}
              <div className="relative mt-5 flex flex-col gap-2">
                <Label className="mb-2 block text-sm font-medium text-white">
                  Role(s)
                </Label>
                <Button
                  className="flex w-3/4 items-center justify-between bg-white/5 px-3 py-2 hover:bg-white/5"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  variant="outline"
                >
                  <div className="mr-2 flex flex-1 items-center gap-2">
                    {selectedRoles.length === 0 ? (
                      <span className="text-gray-400">Select roles</span>
                    ) : (
                      <>
                        {selectedRoles.slice(0, 2).map((role) => (
                          <span
                            className="rounded-full border border-purple-200 bg-[#3B0764] px-4 py-2 text-xs text-purple-200"
                            key={role.roleSlug}
                          >
                            {role.name}
                          </span>
                        ))}
                        {selectedRoles.length > 2 && (
                          <span className="p-2 text-xs text-[#A5F3FC]">
                            +{selectedRoles.length - 2} more
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <ChevronDown
                    className={`flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    size={16}
                  />
                </Button>

                {isDropdownOpen ? (
                  <div className="left-0 right-0 top-full z-50 mt-1 w-3/4 overflow-hidden rounded-md bg-zinc-800 shadow-lg hover:bg-[#27272A]">
                    {roles.map((role) => (
                      <Label
                        className="flex cursor-pointer items-center px-3 py-2"
                        key={role.id}
                      >
                        <Checkbox
                          checked={selectedRoles.some(
                            (r) => r.roleSlug === role.slug
                          )}
                          className="mr-2 rounded-sm border-none bg-gray-400 data-[state=checked]:border-none data-[state=checked]:bg-white data-[state=checked]:text-black"
                          onCheckedChange={() =>
                            toggleRole({ name: role.name, roleSlug: role.slug })
                          }
                        />
                        <span className="text-white">{role.name}</span>
                      </Label>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
