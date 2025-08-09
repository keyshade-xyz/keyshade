import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
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
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import {
  deleteEnvironmentValueOfSecretOpenAtom,
  selectedSecretAtom,
  selectedSecretEnvironmentAtom,
  secretsOfProjectAtom
} from '@/store'

export default function ConfirmDeleteEnvironmentValueOfSecretDialog(): React.JSX.Element {
  const [
    isDeleteEnvironmentValueOfSecretOpen,
    setIsDeleteEnvironmentValueOfSecretOpen
  ] = useAtom(deleteEnvironmentValueOfSecretOpenAtom)
  const [selectedSecret, setSelectedSecret] = useAtom(selectedSecretAtom)
  const [selectedSecretEnvironment, setSelectedSecretEnvironment] = useAtom(
    selectedSecretEnvironmentAtom
  )
  const setSecretsOfProject = useSetAtom(secretsOfProjectAtom)

  const [isLoading, setIsLoading] = useState(false)

  const deleteEnvironmentValueOfSecret = useHttp(() =>
    ControllerInstance.getInstance().secretController.deleteEnvironmentValueOfSecret(
      {
        secretSlug: selectedSecret!.slug,
        environmentSlug: selectedSecretEnvironment!
      }
    )
  )

  const handleClose = useCallback(() => {
    setIsDeleteEnvironmentValueOfSecretOpen(false)
    setSelectedSecret(null)
    setSelectedSecretEnvironment(null)
  }, [
    setIsDeleteEnvironmentValueOfSecretOpen,
    setSelectedSecret,
    setSelectedSecretEnvironment
  ])

  const handleDeleteEnvironmentValueOfSecret = useCallback(async () => {
    if (selectedSecret && selectedSecretEnvironment) {
      setIsLoading(true)
      toast.loading('Deleting environment value...')

      try {
        const { success } = await deleteEnvironmentValueOfSecret()

        if (success) {
          toast.success('Environment value deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The environment value has been deleted.
              </p>
            )
          })

          // Remove the environment value from the state
          setSecretsOfProject((prev) =>
            prev.map((secret) => {
              if (secret.slug === selectedSecret.slug) {
                return {
                  ...secret,
                  versions: secret.versions.filter(
                    (value) =>
                      value.environment.slug !== selectedSecretEnvironment
                  )
                }
              }
              return secret
            })
          )
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
        handleClose()
      }
    }
  }, [
    deleteEnvironmentValueOfSecret,
    handleClose,
    selectedSecret,
    selectedSecretEnvironment,
    setSecretsOfProject
  ])

  return (
    <AlertDialog
      aria-hidden={!isDeleteEnvironmentValueOfSecretOpen}
      onOpenChange={handleClose}
      open={isDeleteEnvironmentValueOfSecretOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete the value for this environment?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            current version of the secret in this environment, and all the
            previous versions.
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
            onClick={handleDeleteEnvironmentValueOfSecret}
          >
            Yes, delete the environment value
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
