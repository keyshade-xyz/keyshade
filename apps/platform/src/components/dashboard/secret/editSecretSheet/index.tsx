import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useState, useEffect } from 'react'
import { toast } from 'sonner'
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
  shouldRevealSecretEnabled,
  selectedSecretAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { Textarea } from '@/components/ui/textarea'
import { useHttp } from '@/hooks/use-http'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import { decrypt } from '@/lib/decrypt'
import {
  mergeExistingEnvironments,
  parseUpdatedEnvironmentValues
} from '@/lib/utils'

export default function EditSecretSheet(): JSX.Element {
  const [isEditSecretSheetOpen, setIsEditSecretSheetOpen] =
    useAtom(editSecretOpenAtom)
  const selectedSecretData = useAtomValue(selectedSecretAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)
  const isDecrypted = useAtomValue(shouldRevealSecretEnabled)
  const { projectPrivateKey } = useProjectPrivateKey()


  const [requestData, setRequestData] = useState<{
    name: string | undefined
    note: string | undefined
  }>({
    name: selectedSecretData?.secret.name,
    note: selectedSecretData?.secret.note || ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >(
    () =>
      selectedSecretData?.values.reduce(
        (acc, entry) => {
          acc[entry.environment.slug] = entry.value
          return acc
        },
        {} as Record<string, string>
      ) || {}
  )
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({})

  useEffect(() => {
    // decrypt environmentvalues 
  if (!projectPrivateKey) return;
  if (isDecrypted) return;

  Object.entries(environmentValues).forEach(([slug, encrypted]) => {
      if (decryptedValues[slug]) return;

      decrypt(projectPrivateKey, encrypted)
        .then((decrypted) => {
          setDecryptedValues((prev) => ({
            ...prev,
            [slug]: decrypted,
          }));
        })
        .catch((error) => {
          // eslint-disable-next-line no-console -- console.error is used for debugging
          console.error('Decryption failed:', error);
          setDecryptedValues((prev) => ({
            ...prev,
            [slug]: 'Decryption failed',
          }));
        });
    });
  }, [projectPrivateKey, environmentValues, isDecrypted, decryptedValues]);


  const updateSecret = useHttp(() =>
    ControllerInstance.getInstance().secretController.updateSecret({
      secretSlug: selectedSecretData!.secret.slug,
      name:
        !requestData.name?.trim() ||
        requestData.name === selectedSecretData!.secret.name
          ? undefined
          : requestData.name.trim(),
      note: requestData.note?.trim() || undefined,
      entries: parseUpdatedEnvironmentValues(
        selectedSecretData!.values,
        isDecrypted ? environmentValues : decryptedValues
      ),
      decryptValue: isDecrypted
    })
  )

  const handleClose = useCallback(() => {
    setIsEditSecretSheetOpen(false)
  }, [setIsEditSecretSheetOpen])

  const handleUpdateSecret = useCallback(async () => {
    if (selectedSecretData) {
      setIsLoading(true)
      toast.loading('Updating secret...')

      try {
        const { success, data } = await updateSecret()

        if (success && data) {
          toast.success('Secret edited successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                You successfully edited the secret
              </p>
            )
          })

          // Update the secret in the store
          setSecrets((prev) => {
            const newSecrets = prev.map((s) => {
              if (s.secret.slug === selectedSecretData.secret.slug) {
                return {
                  ...s,
                  secret: {
                    ...s.secret,
                    name: requestData.name || s.secret.name,
                    note: requestData.note || s.secret.note,
                    slug: data.secret.slug
                  },
                  values: mergeExistingEnvironments(
                    s.values,
                    data.updatedVersions
                  )
                }
              }
              return s
            })
            return newSecrets
          })
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
        handleClose()
      }
    }
  }, [
    selectedSecretData,
    updateSecret,
    setSecrets,
    requestData.name,
    requestData.note,
    handleClose
  ])

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsEditSecretSheetOpen(open)
      }}
      open={isEditSecretSheetOpen}
    >
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit this secret</SheetTitle>
          <SheetDescription className="text-white/60">
            Edit the secret name or the note
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-x-4 gap-y-6 py-8">
          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Secret Name
            </Label>
            <Input
              className="col-span-3 h-[2.75rem]"
              id="name"
              onChange={(e) => {
                setRequestData((prev) => ({
                  ...prev,
                  name: e.target.value
                }))
              }}
              placeholder="Enter the key of the secret"
              value={requestData.name}
            />
          </div>

          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Extra Note
            </Label>
            <Textarea
              className="col-span-3 h-[2.75rem]"
              id="name"
              onChange={(e) => {
                setRequestData((prev) => ({
                  ...prev,
                  note: e.target.value
                }))
              }}
              placeholder="Enter the note of the secret"
              value={requestData.note}
            />
          </div>
          <EnvironmentValueEditor
            environmentValues={isDecrypted ? environmentValues : decryptedValues}
            setEnvironmentValues={isDecrypted ? setEnvironmentValues : setDecryptedValues}
          />
        </div>
        <SheetFooter className="py-3">
          <SheetClose asChild>
            <Button
              className="font-semibold"
              disabled={isLoading}
              onClick={handleUpdateSecret}
              variant="secondary"
            >
              Save changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
