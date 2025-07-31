import { BaseEmailTemplate } from './components/base-email-template'

export const OnboardingReminder3Email = () => {
  return (
    <BaseEmailTemplate
      previewText="Keyshade is better when fully set up"
      heading="Unlock the Full Power of Keyshade"
    >
      <p>Hey there 👋</p>
      <p>
        You’re almost there! Complete your onboarding to start using features
        like:
      </p>
      <ul>
        <li>Encrypted secret storage</li>
        <li>Per-environment access control</li>
        <li>Automated deployments</li>
      </ul>
      <p>Let’s get this done in under 5 minutes.</p>
    </BaseEmailTemplate>
  )
}

export default OnboardingReminder3Email
