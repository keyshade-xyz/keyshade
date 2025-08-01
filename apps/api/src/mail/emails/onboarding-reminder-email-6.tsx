import { BaseEmailTemplate } from './components/base-email-template'

export const OnboardingReminder6Email = () => {
  return (
    <BaseEmailTemplate
      previewText="Last reminder to complete your onboarding"
      heading="Final Nudge 👀"
    >
      <p>This is the final reminder to complete your Keyshade onboarding.</p>
      <p>We’d love to help you get started right and secure your workspaces.</p>
      <p>Let’s do this. We believe you’ll love it once you’re in.</p>
    </BaseEmailTemplate>
  )
}

export default OnboardingReminder6Email
