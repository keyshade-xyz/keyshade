import * as React from 'react'
import { Text, Section } from '@react-email/components'
import dayjs from 'dayjs'
import { text, workspaceDetails, workspaceInfo } from './styles/common-styles'
import BaseEmailTemplate from './components/base-email-template'

interface WorkspaceRemovalEmailProps {
  workspaceName: string
  removedOn: string
}

export const RemovedFromWorkspaceEmail = ({
  workspaceName,
  removedOn
}: WorkspaceRemovalEmailProps) => {
  const formattedRemovedOnDate = dayjs(removedOn).format(
    'ddd, MMM D, YYYY h:mm A'
  )

  return (
    <BaseEmailTemplate
      previewText="Removal from Workspace"
      heading="Removal from Workspace"
    >
      <Text style={text}>Dear User,</Text>
      <Text style={text}>
        We hope this email finds you well. We are writing to inform you that
        your access to the following workspace has been removed:
      </Text>
      <Section style={workspaceDetails}>
        <Text style={workspaceInfo}>
          <strong>Workspace Name:</strong> {workspaceName}
        </Text>
        <Text style={workspaceInfo}>
          <strong>Removed On:</strong> {formattedRemovedOnDate}
        </Text>
      </Section>
    </BaseEmailTemplate>
  )
}

export default RemovedFromWorkspaceEmail
