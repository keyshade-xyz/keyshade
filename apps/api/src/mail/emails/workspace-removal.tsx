import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'
import dayjs from 'dayjs'
import {
  container,
  content,
  footer,
  footerText,
  h1,
  link,
  main,
  text,
  workspaceDetails,
  workspaceInfo
} from '../styles/common-styles'

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
    <Html>
      <Head />
      <Preview>Removal from Workspace</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Heading style={h1}>Removal from Workspace</Heading>
            <Text style={text}>Dear User,</Text>
            <Text style={text}>
              We hope this email finds you well. We are writing to inform you
              that your access to the following workspace has been removed:
            </Text>
            <Section style={workspaceDetails}>
              <Text style={workspaceInfo}>
                <strong>Workspace Name:</strong> {workspaceName}
              </Text>
              <Text style={workspaceInfo}>
                <strong>Removed On:</strong> {formattedRemovedOnDate}
              </Text>
            </Section>
            <Text style={text}>
              If you believe this action was taken in error or have any
              questions regarding this change, please contact your project
              administrator or our support team.
            </Text>
            <Text style={text}>
              We appreciate your understanding and thank you for your
              contributions to the project.
            </Text>
            <Text style={text}>
              Cheers,
              <br />
              Team Keyshade
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated message. Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              Read our{' '}
              <Link href="https://www.keyshade.xyz/privacy" style={link}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="https://www.keyshade.xyz/terms_and_condition"
                style={link}
              >
                Terms and Conditions
              </Link>{' '}
              for more information on how we manage your data and services.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default RemovedFromWorkspaceEmail
