import * as React from 'react'
import {
  Body,
  Button,
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
  ctaButton,
  footer,
  footerText,
  h1,
  link,
  main,
  text,
  workspaceDetails,
  workspaceInfo
} from '../styles/common-styles'

interface WorkspaceInvitationEmailProps {
  projectName: string
  projectUrl: string
  invitedBy: string
  invitedOn: string
  forRegisteredUser: boolean
}

export const WorkspaceInvitationEmail = ({
  projectName,
  projectUrl,
  invitedBy,
  invitedOn,
  forRegisteredUser
}: WorkspaceInvitationEmailProps) => {
  const formattedInvitedOnDate = dayjs(invitedOn).format(
    'ddd, MMM D, YYYY h:mm A'
  )

  return (
    <Html>
      <Head />
      <Preview>
        {forRegisteredUser
          ? 'Welcome Back! Join Your Workspace'
          : 'You are Invited to Join the Workspace'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Heading style={h1}>
              {forRegisteredUser
                ? 'Welcome Back! Join Your Workspace'
                : 'You are Invited to Join the Workspace'}
            </Heading>
            <Text style={text}>Dear User,</Text>
            <Text style={text}>
              We're excited to inform you that you've been invited to join a
              project on Keyshade. Here are the details of your invitation:
            </Text>
            <Section style={workspaceDetails}>
              <Text style={workspaceInfo}>
                <strong>Workspace Name:</strong> {projectName}
              </Text>
              <Text style={workspaceInfo}>
                <strong>Invited By:</strong> {invitedBy}
              </Text>
              <Text style={workspaceInfo}>
                <strong>Invited On:</strong> {invitedOn}
              </Text>
              <Text style={workspaceInfo}>
                <strong>Invited On:</strong> {formattedInvitedOnDate}
              </Text>
            </Section>
            <Text style={text}>
              Join the project by clicking the button below - we're excited to
              have you!
            </Text>
            <Button href={projectUrl} style={ctaButton}>
              Get started
            </Button>
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

export default WorkspaceInvitationEmail
