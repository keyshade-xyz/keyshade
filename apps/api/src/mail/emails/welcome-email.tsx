import type * as React from 'react'
import { Link, Section, Text } from '@react-email/components'
import BaseEmailTemplate from './components/base-email-template'
import {
  ctaButton,
  text,
  workspaceDetails,
  workspaceInfo
} from './styles/common-styles'

interface WelcomeEmailProps {
  username: string
}

export const WelcomeEmail = ({ username }: WelcomeEmailProps) => {
  return (
    <BaseEmailTemplate
      previewText="Welcome to Keyshade - Your secure key management solution"
      heading={`Welcome to Keyshade, ${username}!`}
    >
      <Text style={text}>
        Thank you for joining{' '}
        <Link href="https://www.keyshade.xyz/">Keyshade</Link>. We're excited to
        have you on board and help you manage your secrets and API keys
        securely.
      </Text>

      <Text
        style={{
          ...text,
          fontWeight: '600',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        Here's what you can do with Keyshade:
      </Text>

      <Section style={workspaceDetails}>
        <Text style={{ ...workspaceInfo, fontWeight: '600' }}>
          🔐 Secure Key Management
        </Text>
        <Text style={workspaceInfo}>
          Store and manage all your API keys, tokens, and secrets in one secure
          location with end-to-end encryption.
        </Text>
      </Section>

      <Section style={workspaceDetails}>
        <Text style={{ ...workspaceInfo, fontWeight: '600' }}>
          👥 Team Collaboration
        </Text>
        <Text style={workspaceInfo}>
          Share secrets with your team members securely with granular access
          controls and permissions.
        </Text>
      </Section>

      <Section style={workspaceDetails}>
        <Text style={{ ...workspaceInfo, fontWeight: '600' }}>
          🔄 Versioning
        </Text>
        <Text style={workspaceInfo}>
          Track configuration changes effortlessly, with seamless rollback and
          detailed analysis
        </Text>
      </Section>

      <Section style={workspaceDetails}>
        <Text style={{ ...workspaceInfo, fontWeight: '600' }}>
          🔍 Auditing and Alerting
        </Text>
        <Text style={workspaceInfo}>
          Stay Informed and Secure with Real-Time Monitoring and Instant
          Notifications.
        </Text>
      </Section>

      <Section style={workspaceDetails}>
        <Text style={{ ...workspaceInfo, fontWeight: '600' }}>
          🔑 Role Based Access Control
        </Text>
        <Text style={workspaceInfo}>
          Safeguard Your Data with Granular Access Control and Permissions
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', marginBottom: '10px' }}>
        <Link href={process.env.PLATFORM_FRONTEND_URL} style={ctaButton}>
          Get Started
        </Link>
      </Section>
    </BaseEmailTemplate>
  )
}

export default WelcomeEmail
