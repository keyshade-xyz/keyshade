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
  invitedBy,
  forRegisteredUser
}: WorkspaceInvitationEmailProps) => {
  const previewText = forRegisteredUser
    ? 'Welcome Back! Join Your Keyshade Workspace'
    : 'You are Invited to Join Keyshade Workspace'

  const userName = inviteeName?.trim() || 'there'

  return (
    <BaseEmailTemplate previewText={previewText} heading={previewText}>
      <Text style={{ ...text, marginTop: '32px' }}>
        <strong>Welcome to Keyshade</strong>
      </Text>
      <Text style={text}>Hey {userName},</Text>
      <Text style={text}>
        You have been invited to {workspaceName} on Keyshade by {invitedBy}!
      </Text>
      {/* 
      <Section style={workspaceDetails}>
        <Text style={workspaceInfo}>
          <strong>Workspace Name:</strong> {workspaceName}
        </Text>
        <Text style={workspaceInfo}>
          <strong>Invited By:</strong> {invitedBy}
        </Text>
      </Section>
      */}
      <Text style={text}>Join the project by clicking the button below!</Text>
      <Button href={actionUrl} style={ctaButton}>
        Get started
      </Button>
      <Text style={{ ...text, marginTop: '32px' }}>
        <strong>What happens next?</strong>
      </Text>

      <Text style={text}>
        Once you're in, you'll unlock everything Keyshade has to offer — like
        secure secret sharing, CLI magic, and zero `.env` horror stories.
      </Text>

      <Text style={text}>
        If you’re new here, these quick links will help you get up to speed:
      </Text>

      <ul>
        <li>
          <Text style={text}>
            <a
              href="https://docs.keyshade.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Documentation: What is Keyshade?"
            >
              What is Keyshade?
            </a>{' '}
            — Understand what we’re fixing and why it matters.
          </Text>
        </li>
        <li>
          <Text style={text}>
            <a
              href="https://docs.keyshade.xyz/getting-started/introduction"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Documentation: Getting Started Guide"
            >
              Getting Started Guide
            </a>{' '}
            — Set up Keyshade in your app in minutes.
          </Text>
        </li>
        <li>
          <Text style={text}>
            <a
              href="https://docs.keyshade.xyz/cli/introduction"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Documentation: CLI Overview"
            >
              CLI Overview
            </a>{' '}
            — Learn how to push, pull, and sync secrets like a pro.
          </Text>
        </li>
      </ul>

      <Text style={text}>
        Welcome aboard! You're one step closer to never hearing "wait, did you
        commit the .env to GitHub?" again.
      </Text>
    </BaseEmailTemplate>
  )
}

export default WorkspaceInvitationEmail
