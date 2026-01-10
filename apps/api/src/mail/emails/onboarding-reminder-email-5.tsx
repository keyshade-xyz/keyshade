import { BaseEmailTemplate } from './components/base-email-template'

export const OnboardingReminder5Email = () => {
  return (
    <BaseEmailTemplate
      previewText="Let’s finish your setup today"
      heading="Don’t Leave Keyshade Half-Done"
    >
      <p>Your Keyshade workspace is almost ready.</p>
      <p>Complete your setup and start managing secrets like a pro.</p>
      <p>⚡ Secure, scalable, and simple. Just how it should be.</p>
    </BaseEmailTemplate>
  )
}

export default OnboardingReminder5Email
