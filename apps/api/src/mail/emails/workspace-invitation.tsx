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
    ? 'Welcome Back! Join Your Keyshade Workspace'
    : 'You are Invited to Join the Keyshade Workspace'

  return (
    <BaseEmailTemplate previewText={previewText} heading={previewText}>
      <Text style={{ ...text, marginTop: '32px' }}>
        <strong>Welcome to Keyshade</strong>
      </Text>
      <Text style={text}>Dear User,</Text>
      <Text style={text}>
        We're excited to inform you that you've been invited to join a workspace
        on Keyshade. Here are the details of your invitation:
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
