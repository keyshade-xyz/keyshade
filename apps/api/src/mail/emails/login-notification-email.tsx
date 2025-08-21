import { Button, Text } from '@react-email/components'
import { BaseEmailTemplate } from './components/base-email-template'
import { ctaButton, text } from './styles/common-styles'

export const LoginNotificationEmail = ({
  ip,
  device,
  location,
  date,
  time,
  userEmail
}: {
  ip: string
  device: string
  location: string
  date: string
  time: string
  userEmail: string
}) => {
  const userName = userEmail?.split('@')[0]
  const [browser = '', os = ''] = device.split(' on ')

  return (
    <BaseEmailTemplate
      previewText="A New Login is Detected on your Keyshade Account"
      heading="New Login Detected!"
    >
      <Text style={text}>
        Hey <strong>{userName}</strong>,
      </Text>
      <Text style={text}>
        Your Keyshade account <strong>{userEmail}</strong> was recently
        signed-in from a new location, device or browser.
      </Text>

      <ul>
        <li>
          <strong>Location:</strong> {location}
        </li>
        <li>
          <strong>IP address:</strong> {ip}
        </li>
        <li>
          <strong>Date:</strong> {date}
        </li>
        <li>
          <strong>Time:</strong> {time}
        </li>
        <li>
          <strong>OS:</strong> {os}
        </li>
        <li>
          <strong>Browser:</strong> {browser}
        </li>
      </ul>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <img src="https://via.placeholder.com/150" alt="123" />
        <Text style={text}>
          Not you?
          <br />
          take a few minutes to secure your account.
        </Text>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <Button href="#" style={ctaButton}>
          Secure Account
        </Button>
        <Button href="#" style={ctaButton}>
          Check access token
        </Button>
      </div>
    </BaseEmailTemplate>
  )
}

export default LoginNotificationEmail
