'use client'
import React from 'react'
import { useAtomValue } from 'jotai'
import {
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom,
  deleteEnvironmentValueOfVariableOpenAtom,
  variableRevisionsOpenAtom,
  rollbackVariableOpenAtom,
  selectedProjectAtom
} from '@/store'
import ConfirmDeleteVariable from '@/components/dashboard/variable/confirmDeleteVariable'
import EditVariablSheet from '@/components/dashboard/variable/editVariableSheet'
import ConfirmDeleteEnvironmentValueOfVariableDialog from '@/components/dashboard/variable/confirmDeleteEnvironmentValueOfVariableDialog'
import VariableRevisionsSheet from '@/components/dashboard/variable/variableRevisionsSheet'
import ConfirmRollbackVariable from '@/components/dashboard/variable/confirmRollbackVariable'
import { PageTitle } from '@/components/common/page-title'
import VariableList from '@/components/dashboard/variable/variableList'
import Visible from '@/components/common/visible'

export default function VariablePage(): React.JSX.Element {
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const isDeleteEnvironmentValueOfVariableOpen = useAtomValue(
    deleteEnvironmentValueOfVariableOpenAtom
  )
  const isVariableRevisionsOpen = useAtomValue(variableRevisionsOpenAtom)
  const isRollbackVariableOpen = useAtomValue(rollbackVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const canUpdateVariable = selectedVariable?.entitlements.canUpdate
  const canDeleteVariable = selectedVariable?.entitlements.canDelete

  return (
    <div className="flex h-full w-full justify-center">
      <PageTitle title={`${selectedProject?.name} | Variables`} />
      <VariableList />

      <Visible if={Boolean(isDeleteVariableOpen && canDeleteVariable)}>
        <ConfirmDeleteVariable />
      </Visible>
      <Visible if={Boolean(isEditVariableOpen && canUpdateVariable)}>
        <EditVariablSheet />
      </Visible>
      <Visible
        if={Boolean(
          isDeleteEnvironmentValueOfVariableOpen && canDeleteVariable
        )}
      >
        <ConfirmDeleteEnvironmentValueOfVariableDialog />
      </Visible>
      <Visible if={Boolean(isVariableRevisionsOpen)}>
        <VariableRevisionsSheet />
      </Visible>
      <Visible if={Boolean(isRollbackVariableOpen && canUpdateVariable)}>
        <ConfirmRollbackVariable />
      </Visible>
    </div>
  )
}
