import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { decrypt } from '@keyshade/common'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  editSecretOpenAtom,
  secretsOfProjectAtom,
  selectedProjectAtom,
  selectedSecretAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { Textarea } from '@/components/ui/textarea'
import { useHttp } from '@/hooks/use-http'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import {
  mergeExistingEnvironments,
  parseUpdatedEnvironmentValues
} from '@/lib/utils'

export default function EditSecretSheet(): JSX.Element {
  const [isEditSecretSheetOpen, setIsEditSecretSheetOpen] =
    useAtom(editSecretOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedSecretData = useAtomValue(selectedSecretAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)
  const { projectPrivateKey } = useProjectPrivateKey(selectedProject)

  const [name, setName] = useState(selectedSecretData?.secret.name || '')
  const [note, setNote] = useState(selectedSecretData?.secret.note || '')
  const [isLoading, setIsLoading] = useState(false)
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >({})
  const [originalValues, setOriginalValues] = useState<Record<string, string>>(
    {}
  )

  useEffect(() => {
    if (!projectPrivateKey || !selectedSecretData) return

    const decryptValues = async () => {
      const decrypted: Record<string, string> = {}
      const decryptionPromises = selectedSecretData.values.map(
        async (entry) => {
          try {
            const decryptedValue = await decrypt(projectPrivateKey, entry.value)
            return { slug: entry.environment.slug, value: decryptedValue }
          } catch (error) {
            return { slug: entry.environment.slug, value: '' }
          }
        }
      )

      const results = await Promise.all(decryptionPromises)

      results.forEach(({ slug, value }) => {
        decrypted[slug] = value
      })

      setEnvironmentValues(decrypted)
      setOriginalValues(decrypted)
    }

    decryptValues()
  }, [projectPrivateKey, selectedSecretData])

  const hasChanges = useMemo(() => {
    if (!selectedSecretData) return false

    const nameChanged = name !== selectedSecretData.secret.name
    const noteChanged = note !== (selectedSecretData.secret.note || '')
    const allEnvironmentSlugs = new Set([
      ...Object.keys(originalValues),
      ...Object.keys(environmentValues)
    ])

    const envChanged = Array.from(allEnvironmentSlugs).some((slug) => {
      const originalValue = originalValues[slug] || ''
      const currentValue = environmentValues[slug] || ''
      return originalValue !== currentValue
    })

    return nameChanged || noteChanged || envChanged
  }, [name, note, environmentValues, originalValues, selectedSecretData])

  const getChangedEnvValues = () => {
    const changed: Record<string, string> = {}
    const allEnvironmentSlugs = new Set([
      ...Object.keys(originalValues),
      ...Object.keys(environmentValues)
    ])

    Array.from(allEnvironmentSlugs).forEach((slug) => {
      const originalValue = originalValues[slug] || ''
      const currentValue = environmentValues[slug] || ''

      if (originalValue !== currentValue) {
        changed[slug] = currentValue
      }
    })

    return changed
  }

  const updateSecret = useHttp(() => {
    const changedEnvValues = getChangedEnvValues()
    const hasEnvChanges = Object.keys(changedEnvValues).length > 0

    return ControllerInstance.getInstance().secretController.updateSecret({
      secretSlug: selectedSecretData!.secret.slug,
      name: name !== selectedSecretData!.secret.name ? name.trim() : undefined,
      note:
        note !== (selectedSecretData!.secret.note || '')
          ? note.trim()
          : undefined,
      entries: hasEnvChanges
        ? parseUpdatedEnvironmentValues(
            selectedSecretData!.values.filter((v) =>
              Object.prototype.hasOwnProperty.call(
                changedEnvValues,
                v.environment.slug
              )
            ),
            changedEnvValues
          )
        : undefined
    })
  })

  const handleSave = useCallback(async () => {
    if (!selectedSecretData || !hasChanges) return

    setIsLoading(true)
    toast.loading('Updating secret...')

    try {
      const { success, data } = await updateSecret()

      if (success && data) {
        toast.success('Secret updated successfully')

        setSecrets((prev) =>
          prev.map((s) => {
            if (s.secret.slug === selectedSecretData.secret.slug) {
              return {
                ...s,
                secret: { ...s.secret, name, note, slug: data.secret.slug },
                values: mergeExistingEnvironments(
                  s.values,
                  data.updatedVersions
                )
              }
            }
            return s
          })
        )

        setIsEditSecretSheetOpen(false)
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [
    selectedSecretData,
    hasChanges,
    updateSecret,
    setSecrets,
    name,
    note,
    setIsEditSecretSheetOpen
  ])

  return (
    <Sheet onOpenChange={setIsEditSecretSheetOpen} open={isEditSecretSheetOpen}>
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit Secret</SheetTitle>
          <SheetDescription className="text-white/60">
            Edit the secret name and note, and manage environment values.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-8">
          <div className="space-y-2">
            <Label htmlFor="name">Secret Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter secret name"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter note"
              value={note}
            />
          </div>

          <EnvironmentValueEditor
            environmentValues={environmentValues}
            setEnvironmentValues={setEnvironmentValues}
          />
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button
              disabled={isLoading || !hasChanges}
              onClick={handleSave}
              variant="secondary"
            >
              Save Changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
