import { BaseEmailTemplate } from './components/base-email-template'

export const OnboardingReminder4Email = () => {
  return (
    <BaseEmailTemplate
      previewText="We’re here to help you get started"
      heading="Need Help with Setup?"
    >
      <p>
        It looks like onboarding is still pending for your Keyshade account.
      </p>
      <p>
        Need help? Check our{' '}
        <a href="https://docs.keyshade.xyz">documentation</a> or reach out to
        our team for guidance.
      </p>
      <p>We’re here to help you secure your stack!</p>
    </BaseEmailTemplate>
  )
}

export default OnboardingReminder4Email
