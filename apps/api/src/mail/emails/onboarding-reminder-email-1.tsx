import { BaseEmailTemplate } from './components/base-email-template'

export const OnboardingReminder1Email = (p0: { name: string }) => {
  return (
    <BaseEmailTemplate
      previewText="Welcome to Keyshade! Let’s get your setup started"
      heading="Ready to Secure Your Secrets?"
    >
      <p>Hey {p0.name ?? 'User'} 👋</p>
      <p>You joined Keyshade a few days ago, and we’re excited to have you.</p>
      <p>
        Take a minute to complete your onboarding and start managing your
        secrets safely.
      </p>
      <p>
        <strong>Your workspace is waiting!</strong>
      </p>
    </BaseEmailTemplate>
  )
}

export default OnboardingReminder1Email
