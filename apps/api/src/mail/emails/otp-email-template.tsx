import * as React from 'react'
import { Section, Text } from '@react-email/components'
import { otpStyle, text, workspaceDetails } from './styles/common-styles'
import BaseEmailTemplate from '@/mail/emails/components/base-email-template'

interface OTPEmailTemplateProps {
  otp: string
}

export const OTPEmailTemplate = ({ otp }: OTPEmailTemplateProps) => {
  return (
    <BaseEmailTemplate
      previewText="Your One Time Password (OTP) for Keyshade"
      heading="Your One Time Password (OTP)"
    >
      <Text style={text}>Dear User,</Text>
      <Text style={text}>
        We’ve sent you this email to verify your Keyshade account. Your One-Time
        Password (OTP) is:
      </Text>
      <Section style={workspaceDetails}>
        <Text style={otpStyle}>
          <strong>{otp ?? '0000'}</strong>
        </Text>
      </Section>
      <Text style={text}>
        This OTP will expire in <strong>5 minutes</strong>. Please use it to
        complete your action on Keyshade.
      </Text>
    </BaseEmailTemplate>
  )
}

export default OTPEmailTemplate
