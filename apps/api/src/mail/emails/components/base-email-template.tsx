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
import {
  container,
  content,
  footer,
  footerText,
  h1,
  link,
  main,
  text
} from '../styles/common-styles'

interface BaseEmailTemplateProps {
  previewText: string
  heading: string
  children: React.ReactNode
}

export const BaseEmailTemplate: React.FC<BaseEmailTemplateProps> = ({
  previewText,
  heading,
  children
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Heading style={h1}>{heading}</Heading>
            {children}
            <Text style={text}>
              If you believe this action was taken in error or have any
              questions regarding this change, please contact your project
              administrator or our support team.
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

export default BaseEmailTemplate
