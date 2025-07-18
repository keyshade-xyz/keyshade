'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useSearchParams } from 'next/navigation'
import type { Secret } from '@keyshade/schema'
import EmptySecretListContent from '../emptySecretListSection'
import { Accordion } from '@/components/ui/accordion'
import {
  deleteSecretOpenAtom,
  selectedProjectAtom,
  editSecretOpenAtom,
  deleteEnvironmentValueOfSecretOpenAtom,
  createSecretOpenAtom,
  rollbackSecretOpenAtom,
  globalSearchDataAtom
} from '@/store'
import SecretCard from '@/components/dashboard/secret/secretCard'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import ControllerInstance from '@/lib/controller-instance'
import { cn } from '@/lib/utils'

interface SecretListProps {
  projectPrivateKey: string | null
}

export default function SecretList({
  projectPrivateKey
}: SecretListProps): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const isCreateSecretOpen = useAtomValue(createSecretOpenAtom)
  const isDeleteSecretOpen = useAtomValue(deleteSecretOpenAtom)
  const isEditSecretOpen = useAtomValue(editSecretOpenAtom)
  const isDeleteEnvironmentValueOfSecretOpen = useAtomValue(
    deleteEnvironmentValueOfSecretOpenAtom
  )
  const isRollbackSecretOpen = useAtomValue(rollbackSecretOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false)
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0)

  useEffect(() => {
    const shouldRefetch =
      isCreateSecretOpen ||
      isDeleteSecretOpen ||
      isEditSecretOpen ||
      isDeleteEnvironmentValueOfSecretOpen ||
      isRollbackSecretOpen

    if (shouldRefetch) {
      setRefetchTrigger((prev) => prev + 1)
    }
  }, [
    isCreateSecretOpen,
    isDeleteSecretOpen,
    isEditSecretOpen,
    isDeleteEnvironmentValueOfSecretOpen,
    isRollbackSecretOpen
  ])

  const fetchSecrets = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      if (!selectedProject) {
        return {
          success: false,
          data: { items: [] },
          error: {
            message: JSON.stringify({
              header: 'Error',
              body: 'No project selected'
            })
          }
        }
      }

      try {
        const response =
          await ControllerInstance.getInstance().secretController.getAllSecretsOfProject(
            {
              projectSlug: selectedProject.slug,
              page,
              limit
            }
          )

        // Update global search data on successful fetch
        if (
          response.success &&
          response.data &&
          Array.isArray(response.data.items)
        ) {
          setGlobalSearchData((prev) => ({
            ...prev,
            secrets: response.data!.items.map((item) => ({
              slug: item.secret.slug,
              name: item.secret.name,
              note: item.secret.note
            }))
          }))
        }

        return {
          success: response.success,
          data: {
            items: response.data?.items || [],
            metadata: response.data?.metadata
          },
          error: response.error
            ? { message: response.error.message }
            : undefined
        }
      } catch (error) {
        return {
          success: false,
          data: { items: [] },
          error: {
            message: JSON.stringify({
              header: 'Error',
              body: 'Failed to fetch secrets'
            })
          }
        }
      }
    },
    [selectedProject, setGlobalSearchData]
  )

  const renderSecretCard = useCallback(
    (secretData: Secret) => {
      return (
        <SecretCard
          className={cn(
            highlightSlug === secretData.secret.slug &&
              isHighlighted &&
              'animate-highlight'
          )}
          privateKey={projectPrivateKey}
          secretData={secretData}
        />
      )
    },
    [projectPrivateKey, highlightSlug, isHighlighted]
  )

  useEffect(() => {
    if (!highlightSlug) return

    const element = document.getElementById(`secret-${highlightSlug}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setIsHighlighted(true)
      setTimeout(() => setIsHighlighted(false), 2000)
    }
  }, [highlightSlug])

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white',
        isDeleteSecretOpen && 'inert'
      )}
    >
      <div className="flex h-fit w-full flex-col gap-4">
        <Accordion
          className="flex h-fit w-full flex-col gap-4"
          collapsible
          type="single"
        >
          <InfiniteScrollList
            className="flex h-fit w-full flex-col gap-4"
            emptyComponent={<EmptySecretListContent />}
            fetchFunction={fetchSecrets}
            itemComponent={renderSecretCard}
            itemKey={(secretData) => secretData.secret.id}
            itemsPerPage={10}
            key={refetchTrigger}
          />
        </Accordion>
      </div>
    </div>
  )
}
