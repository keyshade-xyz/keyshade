import { toast } from 'sonner'
import { useAtom } from 'jotai'
import type { ProjectWithCount } from '@keyshade/schema'
import { TrashSVG } from '@public/svg/shared'
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
import { deleteProjectOpenAtom, projectsOfWorkspaceAtom, projectToDeleteAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'

export default function DeleteProjectDialogue(): JSX.Element {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useAtom(deleteProjectOpenAtom)
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)
  const [projectToDelete, setProjectToDelete] = useAtom(projectToDeleteAtom)

  const handleDelete = async () => {
    if (!projectToDelete) return

    try {
      const { success, error } = await ControllerInstance.getInstance().projectController.deleteProject(
        {
          projectSlug: projectToDelete.slug
        },
        {}
      )

      if (success) {
        setProjects(projects.filter((p) => p.id !== projectToDelete.id))
        toast.success('Project deleted successfully')
      } else {
        toast.error('Failed to delete project', {
          description: (
            <p className="text-xs text-red-300">
              {error?.message || 'Something went wrong while deleting the project'}
            </p>
          )
        })
      }
    } catch (error) {
      toast.error('Failed to delete project', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while deleting the project. Check console for more info.
          </p>
        )
      })
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    }

    setIsDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setProjectToDelete(null)
    }
  }

  if (!projectToDelete) return <></>

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={isDeleteDialogOpen}>
      <AlertDialogContent className="bg-[#1C1C1C]/95 border-white/10">
        <AlertDialogHeader>
          <div className="flex items-center justify-center">
            <TrashSVG className="h-10 w-10 text-red-500" />
            <AlertDialogTitle>Do you really want to delete this project?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-white/60">
            This action cannot be undone. This will permanently delete your project and remove your project data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/90 hover:bg-white text-black hover:text-black">Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
            Yes, delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
