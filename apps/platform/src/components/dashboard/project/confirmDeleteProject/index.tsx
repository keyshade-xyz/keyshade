import { useAtom, useSetAtom } from 'jotai'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TrashSVG } from '@public/svg/shared'
import {
  deleteProjectOpenAtom,
  projectsOfWorkspaceAtom,
  selectedProjectAtom,
  workspaceProjectCountAtom
} from '@/store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

function ConfirmDeleteProject(): React.JSX.Element {
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useAtom(
    deleteProjectOpenAtom
  )
  const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom)
  const setWorkspaceProjectCount = useSetAtom(workspaceProjectCountAtom)
  const setProjects = useSetAtom(projectsOfWorkspaceAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const deleteProject = useHttp(() =>
    ControllerInstance.getInstance().projectController.deleteProject({
      projectSlug: selectedProject!.slug
    })
  )

  const handleClose = () => {
    setIsDeleteProjectOpen(false)
  }

  const handleDeleteProject = async () => {
    if (selectedProject) {
      setIsLoading(true)
      toast.loading('Deleting project...')

      try {
        const { success } = await deleteProject()

        if (success) {
          setWorkspaceProjectCount((count) => count - 1)
          toast.success('Project deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The project has been deleted.
              </p>
            )
          })

          // Remove the project from the state
          setProjects((projects) =>
            projects.filter((project) => project.slug !== selectedProject.slug)
          )
          setSelectedProject(null)

          handleClose()
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }

  //Cleaning the pointer events for the context menu after closing the alert dialog
  // if we don't do this the pointer events will be disabled for the whole page
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isDeleteProjectOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isDeleteProjectOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isDeleteProjectOpen}
      onOpenChange={handleClose}
      open={isDeleteProjectOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete project {selectedProject?.name} ?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            project and remove your project data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={isLoading}
            onClick={handleDeleteProject}
          >
            Yes, delete the project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDeleteProject
