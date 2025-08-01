import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Plus } from 'lucide-react'
import { AddSVG } from '@public/svg/shared'
import ViewAndDownloadProjectKeysDialog from '../viewAndDownloadKeysDialog'
import CreateProjectName from './create-project-name'
import CreateProjectDescription from './create-project-description'
import CreateProjectAccessLevel from './create-project-access-level'
import CreateProjectStorePrivateKey from './create-project-store-private-key'
import CreateProjectEnvironmentList from './create-project-environment-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  createProjectOpenAtom,
  selectedWorkspaceAtom,
  viewAndDownloadProjectKeysOpenAtom
} from '@/store'
import Visible from '@/components/common/visible'
import { useProjectCreateData } from '@/hooks/screen/project/createProjectDialogue/use-project-create-data'
import { useCreateNewProject } from '@/hooks/api/use-create-new-project'

export default function CreateProjectDialogue(): JSX.Element {
  const privateKeyWarningRef = useRef<HTMLDivElement | null>(null)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useAtom(
    createProjectOpenAtom
  )
  const isAuthorizedToCreateProjects =
    selectedWorkspace?.entitlements.canCreateProjects

  const [
    isViewAndDownloadProjectKeysDialogOpen,
    setIsViewAndDownloadProjectKeysDialogOpen
  ] = useAtom(viewAndDownloadProjectKeysOpenAtom)

  const [projectSlug, setProjectSlug] = useState<string>('')
  const [projectKeys, setProjectKeys] = useState<{
    projectName: string
    environmentSlug: string
    storePrivateKey: boolean
    keys: { publicKey: string; privateKey: string }
  }>()

  const {
    newProjectData,
    updateEnvironment,
    deleteEnvironment,
    createNewEnvironment,
    updateName,
    updateDescription,
    updateAccessLevel,
    updateStorePrivateKey,
    resetProjectData
  } = useProjectCreateData()

  const { projects, isLoading, createNewProject } = useCreateNewProject(
    newProjectData,
    setProjectKeys,
    setProjectSlug
  )

  const toggleDialog = useCallback(() => {
    setIsCreateProjectDialogOpen((prev) => !prev)
    if (!isCreateProjectDialogOpen) {
      resetProjectData()
    }
  }, [
    isCreateProjectDialogOpen,
    resetProjectData,
    setIsCreateProjectDialogOpen
  ])

  useEffect(() => {
    if (newProjectData.storePrivateKey && privateKeyWarningRef.current) {
      privateKeyWarningRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [newProjectData.storePrivateKey])

  useEffect(() => {
    if (projectKeys) {
      setIsViewAndDownloadProjectKeysDialogOpen(true)
    }
  }, [projectKeys, setIsViewAndDownloadProjectKeysDialogOpen])

  const hasNoEnvironments = newProjectData.environments?.length === 0

  const isProjectsEmpty = useMemo(() => projects.length === 0, [projects])
  return (
    <>
      <Dialog
        onOpenChange={setIsCreateProjectDialogOpen}
        open={isCreateProjectDialogOpen}
      >
        <DialogTrigger asChild>
          {isProjectsEmpty ? null : (
            <Button
              disabled={!isAuthorizedToCreateProjects}
              onClick={toggleDialog}
            >
              <AddSVG /> Create a new Project
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="h-[39.5rem] w-[47rem] max-w-full rounded-[12px] border bg-[#1E1E1F] ">
          <div className="flex h-[3.125rem] w-full flex-col items-start justify-center">
            <DialogTitle className=" font-geist h-[1.875rem] w-[8.5rem] text-[1.125rem] font-semibold text-white ">
              Create Project
            </DialogTitle>

            <DialogDescription className=" font-inter h-[1.25rem] w-full text-[0.875rem] font-normal text-[#D4D4D4]">
              Create your new project
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-y-8 overflow-auto">
            <div className="flex h-[29.125rem] w-full flex-col gap-4 py-4">
              {/* NAME */}
              <CreateProjectName
                onChange={(value) => {
                  updateName(value)
                }}
              />

              {/* DESCRIPTION */}
              <CreateProjectDescription
                onChange={(value) => {
                  updateDescription(value)
                }}
              />

              {/* ACCESS LEVEL */}
              <CreateProjectAccessLevel
                onChange={(value) => {
                  updateAccessLevel(value)
                }}
                value={newProjectData.accessLevel}
              />

              {/* SWITCH */}
              <CreateProjectStorePrivateKey
                checked={newProjectData.storePrivateKey}
                onChange={(checked) => {
                  updateStorePrivateKey(checked)
                }}
              />

              {/* ENVIRONMENTS */}
              <div className="flex flex-col gap-4">
                <Label className="text-base font-semibold">Environments</Label>

                <div className="flex flex-col gap-5">
                  {/* Environment List */}
                  <div className="flex flex-col gap-4">
                    <CreateProjectEnvironmentList
                      environments={newProjectData.environments}
                      hasNoEnvironments={hasNoEnvironments}
                      onChangeDescription={(value, index) => {
                        updateEnvironment(index, 'description', value)
                      }}
                      onChangeName={(value, index) => {
                        updateEnvironment(index, 'name', value)
                      }}
                      onDeleteEnvironment={deleteEnvironment}
                    />
                  </div>
                  <Button
                    className="flex w-max items-center gap-1 text-sm font-medium"
                    onClick={createNewEnvironment}
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-[2.25rem] w-full justify-end">
            <Button
              className="font-inter h-[2.25rem] w-[8rem] rounded-[0.375rem] text-[0.875rem] font-[500]"
              disabled={isLoading}
              onClick={createNewProject}
              variant="secondary"
            >
              Create project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Visible if={isViewAndDownloadProjectKeysDialogOpen}>
        <ViewAndDownloadProjectKeysDialog
          isCreated
          projectKeys={projectKeys}
          projectSlug={projectSlug}
        />
      </Visible>
    </>
  )
}
