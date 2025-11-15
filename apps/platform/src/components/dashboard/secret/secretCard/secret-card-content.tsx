import type { Environment, Secret } from '@keyshade/schema'
import React, { useCallback, useEffect, useState } from 'react'
import { decrypt } from '@keyshade/common'
import { useAtom } from 'jotai/index'
import { EyeOpenSVG, EyeSlashSVG, TrashWhiteSVG } from '@public/svg/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { AccordionContent } from '@/components/ui/accordion'
import ControllerInstance from '@/lib/controller-instance'
import { selectedSecretEnvironmentAtom } from '@/store'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface SecretCardContentProps {
  secretData: Secret
  privateKey: string | null
}

export default function SecretCardContent({
  secretData,
  privateKey
}: SecretCardContentProps): React.JSX.Element {
  const [isSecretRevealed, setIsSecretRevealed] = useState<boolean>(false)
  const [decryptedValues, setDecryptedValues] = useState<
    Record<Environment['id'], string>
  >({})
  const [disabledEnvironments, setDisabledEnvironments] = useState<Set<string>>(
    new Set()
  )

  const [selectedSecretEnvironment, setSelectedSecretEnvironment] = useAtom(
    selectedSecretEnvironmentAtom
  )
  // const setIsDeleteEnvironmentValueOfSecretOpen = useSetAtom(
  //   deleteEnvironmentValueOfSecretOpenAtom
  // )
  // const setSelectedSecret = useSetAtom(selectedSecretAtom)

  const versions = secretData.versions

  // const handleDeleteEnvironmentValueOfSecretClick = (
  //   environment: Environment['slug']
  // ) => {
  //   setSelectedSecret(secretData)
  //   setSelectedSecretEnvironment(environment)
  //   setIsDeleteEnvironmentValueOfSecretOpen(true)
  // }

  const handleToggleDisableSecretClick = async (
    environmentSlug: Environment['slug'],
    environmentId: Environment['id'],
    checked: boolean
  ) => {
    const controller = ControllerInstance.getInstance().secretController
    if (checked) {
      // Enable secret
      await controller.enableSecret({
        secretSlug: secretData.slug,
        environmentSlug
      })
      setDisabledEnvironments((prev) => {
        const next = new Set(prev)
        next.delete(environmentId) // Update local state
        return next
      })
    } else {
      // Disable secret
      await controller.disableSecret({
        secretSlug: secretData.slug,
        environmentSlug
      })
      setDisabledEnvironments((prev) => {
        const next = new Set(prev)
        next.add(environmentId) // Update local state
        return next
      })
    }
  }

  const handleRevealEnvironmentValueOfSecretClick = (
    environment: Environment['slug']
  ) => {
    if (selectedSecretEnvironment === environment && isSecretRevealed) {
      setIsSecretRevealed(false)
    } else {
      setIsSecretRevealed(true)
      handleDecryptValues(environment)
    }
    setSelectedSecretEnvironment(environment)
  }

  const handleDecryptValues = useCallback(
    (environmentSlug: Environment['slug']) => {
      if (!privateKey) return
      const targetValue = versions.find(
        (value) => value.environment.slug === environmentSlug
      )
      if (!targetValue) return

      decrypt(privateKey, targetValue.value)
        .then((decrypted) => {
          setDecryptedValues((prev) => ({
            ...prev,
            [targetValue.environment.id]: decrypted
          }))
        })
        .catch((error) => {
          // eslint-disable-next-line no-console -- console.error is used for debugging
          console.error('Decryption error:', error)
          setDecryptedValues((prev) => ({
            ...prev,
            [targetValue.environment.id]: 'Decryption failed'
          }))
        })
    },
    [privateKey, versions]
  )

  useEffect(() => {
    handleDecryptValues(secretData.versions[0]?.environment.slug)
  }, [secretData.versions, handleDecryptValues])

  useEffect(() => {
    const fetchDisabled = async () => {
      try {
        const res =
          await ControllerInstance.getInstance().secretController.getAllDisabledEnvironmentsOfSecret(
            { secretSlug: secretData.slug }
          )

        if (res.success && res.data) {
          setDisabledEnvironments(new Set(res.data))
        }
      } catch (error) {
        // eslint-disable-next-line no-console -- console.error is used for debugging
        console.error('Failed to load disabled environments', error)
      }
    }

    fetchDisabled()
  }, [secretData.slug])

  return (
    <AccordionContent>
      {versions.length > 0 ? (
        <Table className="h-full w-full rounded-lg">
          <TableHeader className="h-12.5 w-full">
            <TableRow className="h-12.5 w-full hover:bg-transparent">
              <TableHead className="h-full text-base font-normal text-white/50">
                Environment
              </TableHead>
              <TableHead className="h-full min-w-[200px] font-normal text-white/50">
                Value
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                Version
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                View Value
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                Enabled
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((value) => {
              const isRevealed =
                isSecretRevealed &&
                value.environment.slug === selectedSecretEnvironment
              const isDisabled = disabledEnvironments.has(value.environment.id)
              return (
                <TableRow
                  className="h-12.5 group w-full py-4 hover:bg-white/5"
                  key={value.environment.id}
                >
                  <TableCell className="w-41 h-full text-base">
                    {value.environment.name}
                  </TableCell>
                  <TableCell className="h-full min-w-[200px] text-base">
                    {isRevealed
                      ? decryptedValues[value.environment.id]
                      : value.value.replace(/./g, '*').substring(0, 20)}
                  </TableCell>
                  <TableCell className="h-full text-base">
                    {value.version}
                  </TableCell>
                  <TableCell className="h-full">
                    <Button
                      className="flex items-center gap-x-1"
                      onClick={() =>
                        handleRevealEnvironmentValueOfSecretClick(
                          value.environment.slug
                        )
                      }
                      variant="outline"
                    >
                      {isRevealed ? <EyeSlashSVG /> : <EyeOpenSVG />}
                      {isRevealed ? 'Hide Value' : 'Show Value'}
                    </Button>
                  </TableCell>
                  <TableCell className="h-full">
                    <Switch
                      checked={!isDisabled}
                      onCheckedChange={(checked) =>
                        handleToggleDisableSecretClick(
                          value.environment.slug,
                          value.environment.id,
                          checked
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="h-full">
                    <Button variant="outline">
                      <TrashWhiteSVG />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex items-center justify-center py-8 text-sm text-white/50">
          You have not added any values for any environment to this secret yet.
          Edit the secret to add values.
        </div>
      )}
    </AccordionContent>
  )
}
