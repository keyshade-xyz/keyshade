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
import * as React from 'react'
interface WorkspaceRemovalEmailProps {
  workspaceName: string
  removedOn: string
}

export const WorkspaceRemovalEmail = ({
  workspaceName,
  removedOn
}: WorkspaceRemovalEmailProps) => {
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
                <strong>Removed On:</strong> {removedOn}
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

export default WorkspaceRemovalEmail

const main = {
  fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  lineHeight: '1.6',
  color: '#04050a',
  backgroundColor: '#fafafa',
  margin: '0',
  padding: '20px'
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '5px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
}

const content = {
  padding: '20px 40px'
}

const h1 = {
  color: '#000',
  marginBottom: '20px',
  fontSize: '24px',
  fontWeight: '600'
}

const text = {
  marginBottom: '5px',
  color: '#666'
}

const workspaceDetails = {
  width: '100%',
  backgroundColor: '#fafafa',
  borderRadius: '5px',
  margin: '20px 0px',
  padding: '10px 20px'
}

const workspaceInfo = {
  margin: '7px 0px'
}

const footer = {
  borderTop: '1px solid #eaeaea',
  padding: '20px'
}

const footerText = {
  fontSize: '12px',
  color: '#999',
  textAlign: 'center' as const,
  margin: '0'
}

const link = {
  color: '#000',
  textDecoration: 'underline'
}
