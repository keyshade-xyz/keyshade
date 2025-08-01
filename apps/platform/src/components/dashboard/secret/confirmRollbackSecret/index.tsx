import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
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
import {
  revisionsOfSecretAtom,
  rollbackSecretOpenAtom,
  secretsOfProjectAtom,
  selectedSecretAtom,
  selectedSecretEnvironmentAtom,
  selectedSecretRollbackVersionAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

export default function ConfirmRollbackSecret() {
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const [isRollbackSecretOpen, setIsRollbackSecretOpen] = useAtom(
    rollbackSecretOpenAtom
  )
  const [selectedSecretEnvironment, setSelectedSecretEnvironment] = useAtom(
    selectedSecretEnvironmentAtom
  )
  const [selectedSecretRollbackVersion, setSelectedSecretRollbackVersion] =
    useAtom(selectedSecretRollbackVersionAtom)
  const setRevisionsOfSecret = useSetAtom(revisionsOfSecretAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const rollbackSecret = useHttp(() =>
    ControllerInstance.getInstance().secretController.rollbackSecret({
      environmentSlug: selectedSecretEnvironment!,
      version: selectedSecretRollbackVersion!,
      secretSlug: selectedSecret!.slug
    })
  )

  const handleClose = useCallback(() => {
    setIsRollbackSecretOpen(false)
    setSelectedSecretEnvironment(null)
    setSelectedSecretRollbackVersion(null)
  }, [
    setIsRollbackSecretOpen,
    setSelectedSecretEnvironment,
    setSelectedSecretRollbackVersion
  ])

  const handleDeleteSecret = useCallback(async () => {
    if (
      selectedSecret &&
      selectedSecretEnvironment &&
      selectedSecretRollbackVersion
    ) {
      setIsLoading(true)
      toast.loading(
        `Rolling back to version ${selectedSecretRollbackVersion}...`
      )

      try {
        const { success, data } = await rollbackSecret()

        if (success && data) {
          toast.success('Secret rolled back successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                Your secret got rolled back to version{' '}
                <span className="font-semibold">
                  {selectedSecretRollbackVersion}
                </span>
                . {data.count} versions created after that have been removed.
              </p>
            )
          })

          // Remove the versions after the rollback version
          setRevisionsOfSecret((prev) =>
            prev.map((r) => {
              if (r.environment.slug === selectedSecretEnvironment) {
                r.versions = r.versions.filter(
                  (v) => v.version <= selectedSecretRollbackVersion
                )
              }
              return r
            })
          )

          setSecrets((prev) =>
            prev.map((s) => {
              if (s.slug === selectedSecret.slug) {
                s.versions = s.versions.map((v) => {
                  if (v.environment.slug === selectedSecretEnvironment) {
                    return data.currentRevision
                  }
                  return v
                })
              }
              return s
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
    selectedSecret,
    selectedSecretEnvironment,
    selectedSecretRollbackVersion,
    rollbackSecret,
    setRevisionsOfSecret,
    setSecrets,
    handleClose
  ])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isRollbackSecretOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isRollbackSecretOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isRollbackSecretOpen}
      onOpenChange={handleClose}
      open={isRollbackSecretOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to rollback to version{' '}
              {selectedSecretRollbackVersion}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete all the
            versions created after the selected version.
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
            onClick={handleDeleteSecret}
          >
            Yes, rollback to version {selectedSecretRollbackVersion}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
