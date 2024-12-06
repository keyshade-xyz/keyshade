import * as React from 'react'
import { Button, Section, Text } from '@react-email/components'
import dayjs from 'dayjs'
import {
  ctaButton,
  text,
  workspaceDetails,
  workspaceInfo
} from './styles/common-styles'
import BaseEmailTemplate from './components/base-email-template'

interface WorkspaceInvitationEmailProps {
  workspaceName: string
  actionUrl: string
  invitedBy: string
  invitedOn: string
  forRegisteredUser: boolean
}

export const WorkspaceInvitationEmail = ({
  workspaceName,
  actionUrl,
  invitedBy,
  invitedOn,
  forRegisteredUser
}: WorkspaceInvitationEmailProps) => {
  const formattedInvitedOnDate = dayjs(invitedOn).format(
    'ddd, MMM D, YYYY h:mm A'
  )

  const previewText = forRegisteredUser
    ? 'Welcome Back! Join Your Workspace'
    : 'You are Invited to Join the Workspace'

  return (
    <BaseEmailTemplate
      previewText={previewText}
      heading={previewText}
    >
      <Text style={text}>Dear User,</Text>
      <Text style={text}>
        We're excited to inform you that you've been invited to join a
        workspace on Keyshade. Here are the details of your invitation:
      </Text>
      <Section style={workspaceDetails}>
        <Text style={workspaceInfo}>
          <strong>Workspace Name:</strong> {workspaceName}
        </Text>
        <Text style={workspaceInfo}>
          <strong>Invited By:</strong> {invitedBy}
        </Text>
        <Text style={workspaceInfo}>
          <strong>Invited On:</strong> {formattedInvitedOnDate}
        </Text>
      </Section>
      <Text style={text}>
        Join the project by clicking the button below - we're excited to
        have you!
      </Text>
      <Button href={actionUrl} style={ctaButton}>
        Get started
      </Button>
    </BaseEmailTemplate>
  )
}

export default WorkspaceInvitationEmail