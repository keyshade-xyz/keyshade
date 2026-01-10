import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { ctaButton, text } from './styles/common-styles'
import BaseEmailTemplate from './components/base-email-template'

interface WorkspaceInvitationEmailProps {
  inviteeName?: string
  workspaceName: string
  actionUrl: string
  invitedBy: string
  forRegisteredUser: boolean
}

export const WorkspaceInvitationEmail = ({
  inviteeName,
  workspaceName,
  actionUrl,
  invitedBy
}: WorkspaceInvitationEmailProps) => {
  const previewText = 'You are Invited to Join Keyshade Workspace'

  const userName = inviteeName?.trim() || 'there'

  return (
    <BaseEmailTemplate previewText={previewText} heading={previewText}>
      <Text style={text}>
        Hey <strong>{userName}</strong>,
      </Text>
      <Text style={text}>
        You have been invited to join the <strong>{workspaceName}</strong> on
        Keyshade by {invitedBy}!
      </Text>

      <Text style={text}>Here you&apos;ll be able to:</Text>
      <ul>
        <li>
          <Text style={text}>Collaborate with your team in real-time</Text>
        </li>
        <li>
          <Text style={text}>Access shared resources and tools</Text>
        </li>
        <li>
          <Text style={text}>
            Stay updated on everything happening in the workspace
          </Text>
        </li>
      </ul>

      <Button href={actionUrl} style={ctaButton}>
        Join Workspace
      </Button>

      <Text style={text}>
        If you weren't expecting this invitation, you can safely ignore this
        email. Looking forward to seeing you inside!
      </Text>
      <Text style={text}>
        Best,
        <br />
        The Keyshade Team
      </Text>
    </BaseEmailTemplate>
  )
}

export default WorkspaceInvitationEmail
