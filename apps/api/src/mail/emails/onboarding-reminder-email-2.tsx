import { BaseEmailTemplate } from './components/base-email-template'

export const OnboardingReminder2Email = () => {
  return (
    <BaseEmailTemplate
      previewText="Still setting up Keyshade? We can help."
      heading="Still Need to Set Things Up?"
    >
      <p>Hi again 👋</p>
      <p>
        We noticed you haven’t finished onboarding. Just a few quick steps left.
      </p>
      <p>
        Get your projects secured, add your team, and unlock full control over
        your environments.
      </p>
    </BaseEmailTemplate>
  )
}

export default OnboardingReminder2Email
