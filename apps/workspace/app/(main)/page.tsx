'use client'
import { useState } from 'react'
import ProjectCard from '@/components/dashboard/projectCard'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
  // SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const details = [
  {
    title: 'backend-server',
    description: 'This a description for your project',
    environment: 2,
    config: 10,
    secret: 5
  },
  {
    title: 'frontend-server',
    description: 'This a description for your project',
    environment: 2,
    config: 10,
    secret: 5
  }
]

export default function Index(): JSX.Element {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[1.75rem] font-semibold ">My Projects</h1>
      <div className="grid h-[70vh] gap-6 overflow-y-auto scroll-smooth p-2 md:grid-cols-2 2xl:grid-cols-3">
        {details.map((projectDetails, index) => {
          return (
            <ProjectCard
              config={projectDetails.config}
              description={projectDetails.description}
              environment={projectDetails.environment}
              // eslint-disable-next-line react/no-array-index-key -- key is not used as a prop
              key={index}
              secret={projectDetails.secret}
              setIsSheetOpen={setIsSheetOpen}
              title={projectDetails.title}
            />
          )
        })}
      </div>
      <Sheet
        onOpenChange={(open) => {
          setIsSheetOpen(open)
        }}
        open={isSheetOpen}
      >
        <SheetContent className="border-white/15 bg-[#222425]">
          <SheetHeader>
            <SheetTitle className="text-white">Edit Project</SheetTitle>
            <SheetDescription>
              Make changes to the project details
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-start gap-4">
              <Label className="text-right" htmlFor="name">
                Project Name
              </Label>
              <Input className="col-span-3" id="name" />
            </div>
            <div className="flex flex-col items-start gap-4">
              <Label className="text-right" htmlFor="name">
                Project description
              </Label>
              <Input className="col-span-3" id="name" />
            </div>

            <div className="flex items-center justify-between">
              <Label className="w-[10rem] text-left" htmlFor="name">
                Do you want us to store the private key?
              </Label>
              <div className="flex gap-1 text-sm">
                <div>No</div>
                <Switch />
                <div>Yes</div>
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" variant="secondary">
                Save changes
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
