'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AddSVG } from '@public/svg/shared'
import type {
  ClientResponse,
  CreateVariableRequest,
  Environment,
  GetAllEnvironmentsOfProjectResponse,
  Project
} from '@keyshade/schema'
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
import ControllerInstance from '@/lib/controller-instance'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

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
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [newVariableData, setNewVariableData] = useState({
    variableName: '',
    note: '',
    environmentName: '',
    environmentValue: ''
  })
  const [availableEnvironments, setAvailableEnvironments] = useState<Environment[]>([])

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  const addVariable = async (e: any) => {
    e.preventDefault()

    const request: CreateVariableRequest = {
      name: newVariableData.variableName,
      projectSlug: currentProject?.slug as string,
      entries: newVariableData.environmentValue
        ? [
            {
              value: newVariableData.environmentValue,
              environmentSlug: newVariableData.environmentName
            }
          ]
        : undefined,
      note: newVariableData.note
    }

    const { success, error, data } = await ControllerInstance.getInstance().variableController.createVariable(
        request,
        {}
      )
    
    if(error){
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    }

    setIsOpen(false)
  }

  useEffect(() => {
    async function getProjectBySlug() {
      const { success, error, data } =
        await ControllerInstance.getInstance().projectController.getProject(
          { projectSlug: params.project },
          {}
        )

      if (success && data) {
        //@ts-ignore
        setCurrentProject(data)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getProjectBySlug()
  }, [params.project])

  useEffect(() => {
    const getAllEnvironments = async () => {
      const { success, error, data }: ClientResponse<GetAllEnvironmentsOfProjectResponse> = await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
          { projectSlug: currentProject!.slug },
          {}
        )

      if (success && data) {
        setAvailableEnvironments(data.items)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getAllEnvironments()
  }, [currentProject])

  return (
    <main className="flex flex-col gap-4">
      <div className="flex justify-between ">
        <div className="text-3xl">{currentProject?.name}</div>
        {tab === 'secret' && (
          <Dialog>
            <DialogTrigger>
              <Button>
                {' '}
                <AddSVG /> Add Secret
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
        )}
        {tab === 'variable' && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className='bg-[#26282C] hover:bg-[#161819] hover:text-white/55'> 
                <AddSVG /> Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent className="h-[23.313rem] w-[31.625rem] border-gray-800 bg-[#1a1a1a] text-white ">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">
                  <div className="flex h-[2.813rem] w-[28.313rem] flex-col justify-start gap-y-2 ">
                    <p className="h-[1.25rem] w-[9.375rem] text-base">
                      Add a new variable
                    </p>
                    <p className="h-[1.063rem] w-[28.313rem] text-sm font-[400] text-white text-opacity-60">
                      Add a new variable to the project
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className=" text-white">
                <form className="space-y-4">
                  <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                    <label
                      htmlFor="variable-name"
                      className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                    >
                      Variable Name
                    </label>
                    <Input
                      id="variable-name"
                      placeholder="Enter the key of the variable"
                      value={newVariableData.variableName}
                      onChange={(e) =>
                        setNewVariableData({
                          ...newVariableData,
                          variableName: e.target.value
                        })
                      }
                      className="h-[2.75rem] w-[20rem] border-0 bg-[#2a2a2a] text-gray-300 placeholder:text-gray-500"
                    />
                  </div>

                  <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                    <label
                      htmlFor="variable-name"
                      className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                    >
                      Extra Note
                    </label>
                    <Input
                      id="variable-name"
                      placeholder="Enter the note of the secret"
                      value={newVariableData.note}
                      onChange={(e) =>
                        setNewVariableData({
                          ...newVariableData,
                          note: e.target.value
                        })
                      }
                      className="h-[2.75rem] w-[20rem] border-0 bg-[#2a2a2a] text-gray-300 placeholder:text-gray-500"
                    />
                  </div>

                  <div className="grid h-[4.5rem] w-[28.125rem] grid-cols-2 gap-4">
                    <div className="h-[4.5rem] w-[13.5rem] space-y-2">
                      <label className="h-[1.25rem] w-[9.75rem] text-base font-semibold">
                        Environment Name
                      </label>
                      <Select
                        defaultValue="development"
                        onValueChange={(value) =>
                          setNewVariableData({
                            ...newVariableData,
                            environmentName: value
                          })
                        }
                      >
                        <SelectTrigger className="h-[2.75rem] w-[13.5rem] border-0 bg-[#2a2a2a] text-gray-300">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent className=" w-[13.5rem] border-0 bg-[#2a2a2a] text-gray-300">
                          {availableEnvironments.map((env) => (
                            <SelectItem key={env.id} value={env.slug}>
                              {env.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="h-[4.5rem] w-[13.375rem] space-y-2">
                      <label
                        htmlFor="env-value"
                        className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                      >
                        Environment Value
                      </label>
                      <Input
                        id="env-value"
                        placeholder="Environment Value"
                        value={newVariableData.environmentValue}
                        onChange={(e) =>
                          setNewVariableData({
                            ...newVariableData,
                            environmentValue: e.target.value
                          })
                        }
                        className="h-[2.75rem] w-[13.5rem] border-0 bg-[#2a2a2a] text-gray-300 placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                      onClick={addVariable}
                    >
                      Add Variable
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div>
        {tab === 'secret' && secret}
        {tab === 'variable' && variable}
      </div>
    </main>
  )
}

export default DetailedProjectPage
