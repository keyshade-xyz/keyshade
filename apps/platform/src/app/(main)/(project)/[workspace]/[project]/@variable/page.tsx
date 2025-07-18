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

  return (
    <div className="flex h-full w-full justify-center">
      <PageTitle title={`${selectedProject?.name} | Variables`} />
      <VariableList />

      {isDeleteVariableOpen && selectedVariable ? (
        <ConfirmDeleteVariable />
      ) : null}
      {isEditVariableOpen && selectedVariable ? <EditVariablSheet /> : null}
      {isDeleteEnvironmentValueOfVariableOpen && selectedVariable ? (
        <ConfirmDeleteEnvironmentValueOfVariableDialog />
      ) : null}
      {isVariableRevisionsOpen && selectedVariable ? (
        <VariableRevisionsSheet />
      ) : null}
      {isRollbackVariableOpen && selectedVariable ? (
        <ConfirmRollbackVariable />
      ) : null}
    </div>
  )
}
