'use client'
import { useEffect, useState } from 'react'
import { AddSVG } from '@public/svg/shared'
import { useSearchParams } from 'next/navigation'
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
import type { Project } from '@/types'
import { Projects } from '@/lib/api-functions/projects'

interface DetailedProjectPageProps {
  params: { project: string }
  secret: React.ReactNode
  variable: React.ReactNode
}

function DetailedProjectPage({
  params,
  secret,
  variable
}: DetailedProjectPageProps): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be used later
  const [key, setKey] = useState<string>('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be used later
  const [value, setValue] = useState<string>('')

  const [currentProject, setCurrentProject] = useState<Project>()

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  useEffect(() => {
    Projects.getProjectbyID(params.project)
      .then((project) => {
        setCurrentProject(project)
      })
      .catch((error) => {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      })
  }, [params.project])

  return (
    <main className="flex flex-col gap-4">
      <div className="flex justify-between ">
        <div className="text-3xl">{currentProject?.name}</div>
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
      <div>
        {tab === 'secret' && secret}
        {tab === 'variable' && variable}
      </div>
    </main>
  )
}

export default DetailedProjectPage
