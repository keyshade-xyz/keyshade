import { Text, Section } from '@react-email/components'
import { otpStyle, text, workspaceDetails } from './styles/common-styles'
import BaseEmailTemplate from './components/base-email-template'

interface SignInCodeEmailTemplateProps {
  signinCode: string
  userName: string
}

export const SignInCodeEmailTemplate = ({
  signinCode,
  userName
}: SignInCodeEmailTemplateProps) => {
  return (
    <BaseEmailTemplate
      previewText="Your Sign in Code for Keyshade CLI"
      heading="Keyshade Sign in Code"
    >
      <Text style={text}>Dear {userName ?? 'User'},</Text>
      <Text style={text}>
        We’ve sent you this email to verify your Keyshade account. Your Sign in
        Code is:
      </Text>
      <Section style={workspaceDetails}>
        <Text style={otpStyle}>
          <strong>{signinCode ?? '0000'}</strong>
        </Text>
      </Section>
      <Text style={text}>
        This Sign in Code will expire in <strong>5 minutes</strong>. Please use
        it to complete your action on Keyshade CLI.
      </Text>
    </BaseEmailTemplate>
  )
}

export default SignInCodeEmailTemplate
