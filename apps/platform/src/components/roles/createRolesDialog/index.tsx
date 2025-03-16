import { AddSVG } from '@public/svg/shared'
import { useAtom } from 'jotai'
import React, { useState } from 'react'
import type { AuthorityEnum } from '@keyshade/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createRolesOpenAtom } from '@/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import AuthoritySelector from '@/components/common/authority-selector'
import { Separator } from '@/components/ui/separator'

const COLORS_LIST = [
  {
    name: 'Emerald',
    color: '#10b981'
  },
  {
    name: 'Cyan',
    color: '#06b6d4'
  },
  {
    name: 'Indigo',
    color: '#6366f1'
  },
  {
    name: 'Purple',
    color: '#a855f7'
  },
  {
    name: 'fuchsia',
    color: '#d946ef'
  }
]

function CreateRolesDialog() {
  const [isCreateRolesOpen, setIsCreateRolesOpen] = useAtom(createRolesOpenAtom)

    const [selectedPermissions, setSelectedPermissions] = useState<
	  Set<AuthorityEnum>
	>(new Set())

  return (
    <Dialog onOpenChange={setIsCreateRolesOpen} open={isCreateRolesOpen}>
      <DialogTrigger>
        {/* {isProjectsEmpty ? null : ( */}
        <Button
        //   onClick={toggleDialog}
        >
          <AddSVG /> Add Role
        </Button>
        {/* )} */}
      </DialogTrigger>
      <DialogContent className="h-[39.5rem] w-full rounded-[12px] border bg-[#1E1E1F] ">
        <div className="flex h-[3.125rem] w-full flex-col items-start justify-center">
          <DialogHeader className=" font-geist h-[1.875rem] w-[8.5rem] text-[1.125rem] font-semibold text-white ">
            Create Role
          </DialogHeader>

          <DialogDescription className=" font-inter h-[1.25rem] w-full text-[0.875rem] font-normal text-[#D4D4D4]">
            Create a new role for your workspace
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-y-8 overflow-auto">
          <div className="flex h-[29.125rem] w-full flex-col gap-[1rem] py-[1rem] ">
            {/* NAME */}
            <div className="flex h-[2.25rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="name"
              >
                Name
              </Label>
              <Input
                className="col-span-3 h-[2.25rem] w-[20rem] "
                id="name"
                // onChange={(e) => {
                //   setNewProjectData((prev) => ({
                // 	...prev,
                // 	name: e.target.value
                //   }))
                // }}
                placeholder="Enter the name"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="flex h-[5.625rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="description"
              >
                Description
              </Label>
              <Textarea
                className="col-span-3 h-[5.625rem] w-[20rem] resize-none gap-[0.25rem]"
                id="description"
                // onChange={(e) => {
                //   setNewProjectData((prev) => ({
                // 	...prev,
                // 	description: e.target.value
                //   }))
                // }}
                placeholder="Short description about the role"
              />
            </div>
            {/* Colour Picker */}
            <div className="flex h-[5.625rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="color"
              >
                Color
              </Label>
              <Select>
                <SelectTrigger className="h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white ">
                  {COLORS_LIST.map((color, index) => {
                    return (
                      <SelectItem
                        className="cursor-pointer"
                        key={color.color}
                        value={index.toString()}
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full bg-${color.name.toLowerCase()}-500`}
                          />
                          <span className="truncate">{color.name}</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <AuthoritySelector
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
            />
			<Separator />
			<div>
				<h2 className='font-semibold text-base text-white'>
					Projects and Environments
				</h2>
				<p className='text-sm text-neutral-300'>
					Projects and environment this role would have access to 
				</p>
			</div>
          </div>
        </div>
        <div className="flex h-[2.25rem] w-full justify-end">
          <Button
            className="font-inter h-[2.25rem] w-[8rem] rounded-[0.375rem] text-[0.875rem] font-[500]"
            // disabled={isLoading}
            // onClick={handleCreateNewProject}
            variant="secondary"
          >
            Create role
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateRolesDialog
