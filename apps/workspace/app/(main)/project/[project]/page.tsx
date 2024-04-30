'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddSVG } from '@public/svg/shared'

interface DetailedProjectPageProps {
  params: { project: string }
}

function DetailedProjectPage({
  params
}: DetailedProjectPageProps): JSX.Element {
  const [key, setKey] = useState<string>('')
  const [value, setValue] = useState<string>('')

  // eslint-disable-next-line no-console -- //! TODO: remove
  console.log(`Key: ${key} Value: ${value}`)

  return (
    <div>
      <div className="flex justify-between">
        <div className="text-3xl">{params.project}</div>
        <Dialog>
          <DialogTrigger>
            <Button>
              {' '}
              <AddSVG /> Add Key
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
                    onChange={(e) => {
                      setKey(e.target.value)
                    }}
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
                    onChange={(e) => {
                      setValue(e.target.value)
                    }}
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

export default DetailedProjectPage
