import { BaseEmailTemplate } from './components/base-email-template'

export const LoginNotificationEmail = ({
  ip,
  device,
  location
}: {
  ip: string
  device: string
  location?: string
}) => {
  return (
    <BaseEmailTemplate
      previewText="A New Login is Detected on your Keyshade Account"
      heading="New Login Detected"
    >
      <p>We noticed a login to your Keyshade account.</p>
      <ul>
        <li>
          <strong>IP:</strong> {ip}
        </li>
        <li>
          <strong>Location:</strong> {location || 'Unknown'}
        </li>
        <li>
          <strong>Device:</strong> {device}
        </li>
      </ul>
      <p>If this wasn’t you, please reset your password immediately.</p>
    </BaseEmailTemplate>
  )
}

export default LoginNotificationEmail
