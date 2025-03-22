'use client'
import { AddSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function MembersHeader(): React.JSX.Element {
  return (
    <div className="flex justify-between">
      <div className="text-3xl font-medium">Members</div>
      <div className="flex gap-x-4">
        <Dialog>
          <DialogTrigger>
            <Button>
              {' '}
              <AddSVG /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new secret</DialogTitle>
              <DialogDescription>
                Add a new secret to the project. This secret will be encrypted
                and stored securely.
              </DialogDescription>
            </DialogHeader>
            <div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right" htmlFor="username">
                    Key
                  </Label>
                  <Input
                    className="col-span-3"
                    id="username"
                    // onChange={(e) => {
                    //   setKey(e.target.value)
                    // }}
                    placeholder="Enter the name of the secret"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right" htmlFor="username">
                    Value
                  </Label>
                  <Input
                    className="col-span-3"
                    id="username"
                    // onChange={(e) => {
                    //   setValue(e.target.value)
                    // }}
                    placeholder="Enter the value of the secret"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary">Add Key</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
