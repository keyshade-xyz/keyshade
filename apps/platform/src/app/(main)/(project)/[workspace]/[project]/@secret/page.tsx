'use client'
import React from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtomValue } from 'jotai'
import {
  deleteEnvironmentValueOfSecretOpenAtom,
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  rollbackSecretOpenAtom,
  secretRevisionsOpenAtom,
  selectedProjectAtom,
  selectedSecretAtom
} from '@/store'
import ConfirmDeleteSecret from '@/components/dashboard/secret/confirmDeleteSecret'
import EditSecretSheet from '@/components/dashboard/secret/editSecretSheet'
import ConfirmDeleteEnvironmentValueOfSecretDialog from '@/components/dashboard/secret/confirmDeleteEnvironmentValueOfSecret'
import SecretRevisionsSheet from '@/components/dashboard/secret/secretRevisionSheet'
import ConfirmRollbackSecret from '@/components/dashboard/secret/confirmRollbackSecret'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import { PageTitle } from '@/components/common/page-title'
import SecretList from '@/components/dashboard/secret/secretLists'
import Visible from '@/components/common/visible'

extend(relativeTime)

export default function SecretPage(): React.JSX.Element {
  const isEditSecretOpen = useAtomValue(editSecretOpenAtom)
  const isDeleteSecretOpen = useAtomValue(deleteSecretOpenAtom)
  const isDeleteEnvironmentValueOfSecretOpen = useAtomValue(
    deleteEnvironmentValueOfSecretOpenAtom
  )
  const isSecretRevisionsOpen = useAtomValue(secretRevisionsOpenAtom)
  const isRollbackSecretOpen = useAtomValue(rollbackSecretOpenAtom)
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const { projectPrivateKey } = useProjectPrivateKey(selectedProject)

  const canUpdateSecret = selectedSecret?.entitlements.canUpdate
  const canDeleteSecret = selectedSecret?.entitlements.canDelete

  return (
    <div className="flex h-full w-full justify-center">
      <PageTitle title={`${selectedProject?.name} | Secrets`} />
      <SecretList projectPrivateKey={projectPrivateKey} />

      <Visible if={Boolean(isDeleteSecretOpen && canDeleteSecret)}>
        <ConfirmDeleteSecret />
      </Visible>

      <Visible if={Boolean(isEditSecretOpen && canUpdateSecret)}>
        <EditSecretSheet />
      </Visible>
      <Visible
        if={Boolean(isDeleteEnvironmentValueOfSecretOpen && canDeleteSecret)}
      >
        <ConfirmDeleteEnvironmentValueOfSecretDialog />
      </Visible>
      <Visible if={Boolean(isSecretRevisionsOpen)}>
        <SecretRevisionsSheet />
      </Visible>
      <Visible if={Boolean(isRollbackSecretOpen && canUpdateSecret)}>
        <ConfirmRollbackSecret />
      </Visible>
    </div>
  )
}
