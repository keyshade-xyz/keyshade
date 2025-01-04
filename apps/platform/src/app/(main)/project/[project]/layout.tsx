'use client'
import type { MouseEvent, MouseEventHandler } from 'react'
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
import { toast } from 'sonner'
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
import VariablePage from './@variable/page'
import { Toaster } from '@/components/ui/sonner'
import AddSecretDialog from '@/components/ui/add-secret-dialog'

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
  const [currentProject, setCurrentProject] = useState<Project>()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [newVariableData, setNewVariableData] = useState({
    variableName: '',
    note: '',
    environmentName: '',
    environmentValue: ''
  })
  const [newSecretData, setNewSecretData] = useState({
    secretName: '',
    secretNote: '',
    environmentName: '',
    environmentValue: '',
  })
  const [availableEnvironments, setAvailableEnvironments] = useState<
    Environment[]
  >([])

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  const addVariable = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!currentProject) {
      throw new Error("Current project doesn't exist")
    }

    const request: CreateVariableRequest = {
      name: newVariableData.variableName,
      projectSlug: currentProject.slug,
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

    const { success, error } =
      await ControllerInstance.getInstance().variableController.createVariable(
        request,
        {}
      )

    if (success) {
      toast.success('Variable added successfully', {
        // eslint-disable-next-line react/no-unstable-nested-components -- we need to nest the description
        description: () => (
          <p className="text-xs text-emerald-300">
            The variable has been added to the project
          </p>
        )
      })
    }

    if (error) {
      if (error.statusCode === 409) {
        toast.error('Variable name already exists', {
          // eslint-disable-next-line react/no-unstable-nested-components -- we need to nest the description
          description: () => (
            <p className="text-xs text-red-300">
              Variable name is already there, kindly use different one.
            </p>
          )
        })
      } else {
        // eslint-disable-next-line no-console -- we need to log the error that are not in the if condition
        console.error(error)
      }
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
      if (!currentProject) {
        return
      }

      const {
        success,
        error,
        data
      }: ClientResponse<GetAllEnvironmentsOfProjectResponse> =
        await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
          { projectSlug: currentProject.slug },
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
      <div className="flex h-[3.625rem] w-full justify-between p-3 ">
        <div className="text-3xl">{currentProject?.name}</div>
        {tab === 'secret' && (
          <AddSecretDialog 
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            newSecretData={newSecretData}
            setNewSecretData={setNewSecretData}
            availableEnvironments={availableEnvironments}
            currentProjectSlug={currentProject?.slug ?? ''}
          />
        )}
        {tab === 'variable' && (
          <Dialog onOpenChange={setIsOpen} open={isOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
                variant="outline"
              >
                <AddSVG /> Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent className="h-[25rem] w-[31.625rem] bg-[#18181B] text-white ">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">
                  Add a new variable
                </DialogTitle>
                <DialogDescription>
                  Add a new variable to the project
                </DialogDescription>
              </DialogHeader>

              <div className=" text-white">
                <div className="space-y-4">
                  <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                    <label
                      className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                      htmlFor="variable-name"
                    >
                      Variable Name
                    </label>
                    <Input
                      className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                      id="variable-name"
                      onChange={(e) =>
                        setNewVariableData({
                          ...newVariableData,
                          variableName: e.target.value
                        })
                      }
                      placeholder="Enter the key of the variable"
                      value={newVariableData.variableName}
                    />
                  </div>

                  <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                    <label
                      className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                      htmlFor="variable-name"
                    >
                      Extra Note
                    </label>
                    <Input
                      className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                      id="variable-name"
                      onChange={(e) =>
                        setNewVariableData({
                          ...newVariableData,
                          note: e.target.value
                        })
                      }
                      placeholder="Enter the note of the variable"
                      value={newVariableData.note}
                    />
                  </div>

                  <div className="grid h-[4.5rem] w-[28.125rem] grid-cols-2 gap-4">
                    <div className="h-[4.5rem] w-[13.5rem] space-y-2">
                      <label
                        className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                        htmlFor="envName"
                      >
                        Environment Name
                      </label>
                      <Select
                        defaultValue="development"
                        onValueChange={(val) =>
                          setNewVariableData({
                            ...newVariableData,
                            environmentName: val
                          })
                        }
                      >
                        <SelectTrigger className="h-[2.75rem] w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent className=" w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300">
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
                        className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                        htmlFor="env-value"
                      >
                        Environment Value
                      </label>
                      <Input
                        className="h-[2.75rem] w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                        id="env-value"
                        onChange={(e) =>
                          setNewVariableData({
                            ...newVariableData,
                            environmentValue: e.target.value
                          })
                        }
                        placeholder="Environment Value"
                        value={newVariableData.environmentValue}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                      onClick={addVariable}
                    >
                      Add Variable
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="h-full w-full overflow-y-scroll">
        {tab === 'secret' && secret}
        {tab === 'variable' && <VariablePage currentProject={currentProject} />}
        {/* {tab === 'variable' && variable} */}
      </div>
      <Toaster />
    </main>
  )
}

export default DetailedProjectPage
