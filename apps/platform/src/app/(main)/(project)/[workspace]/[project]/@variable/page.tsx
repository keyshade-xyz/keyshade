'use client'
import React from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtomValue } from 'jotai'
import {
  deleteEnvironmentValueOfVariableOpenAtom,
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  rollbackVariableOpenAtom,
  selectedProjectAtom,
  selectedVariableAtom,
  variableRevisionsOpenAtom
} from '@/store'
import ConfirmDeleteVariable from '@/components/dashboard/variable/confirmDeleteVariable'
import EditVariableSheet from '@/components/dashboard/variable/editVariableSheet'
import ConfirmRollbackVariable from '@/components/dashboard/variable/confirmRollbackVariable'
import { PageTitle } from '@/components/common/page-title'
import VariableList from '@/components/dashboard/variable/variableLists'
import Visible from '@/components/common/visible'
import ConfirmDeleteEnvironmentValueOfVariableDialog from '@/components/dashboard/variable/confirmDeleteEnvironmentValueOfVariableDialog'
import VariableRevisionsSheet from '@/components/dashboard/variable/variableRevisionsSheet'

extend(relativeTime)

export default function VariablePage(): React.JSX.Element {
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isDeleteEnvironmentValueOfVariableOpen = useAtomValue(
    deleteEnvironmentValueOfVariableOpenAtom
  )
  const isVariableRevisionsOpen = useAtomValue(variableRevisionsOpenAtom)
  const isRollbackVariableOpen = useAtomValue(rollbackVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const isAuthorizedToEditVariables = selectedVariable?.entitlements.canUpdate
  const isAuthorizedToDeleteVariables = selectedVariable?.entitlements.canDelete

  return (
    <div className="flex h-full w-full justify-center">
      <PageTitle title={`${selectedProject?.name} | Variables`} />
      <VariableList />

      <Visible
        if={Boolean(isDeleteVariableOpen && isAuthorizedToDeleteVariables)}
      >
        <ConfirmDeleteVariable />
      </Visible>

      <Visible if={Boolean(isEditVariableOpen && isAuthorizedToEditVariables)}>
        <EditVariableSheet />
      </Visible>
      <Visible
        if={Boolean(
          isDeleteEnvironmentValueOfVariableOpen &&
            isAuthorizedToDeleteVariables
        )}
      >
        <ConfirmDeleteEnvironmentValueOfVariableDialog />
      </Visible>
      <Visible if={Boolean(isVariableRevisionsOpen)}>
        <VariableRevisionsSheet />
      </Visible>
      <Visible
        if={Boolean(isRollbackVariableOpen && isAuthorizedToEditVariables)}
      >
        <ConfirmRollbackVariable />
      </Visible>
    </div>
  )
}
