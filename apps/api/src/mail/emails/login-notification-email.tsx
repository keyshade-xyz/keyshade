import { Button, Text, Img } from '@react-email/components'
import { BaseEmailTemplate } from './components/base-email-template'
import { ctaButton, h2, iconStyle, text } from './styles/common-styles'

const infoGrid = {
  width: '100%',
  display: 'table',
  marginBottom: '15px',
  tableLayout: 'fixed' as const
}

const infoItem = {
  display: 'table-cell',
  width: '50%',
  verticalAlign: 'top',
  paddingRight: '10px'
}

const infoItemContent = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px'
}

const infoContent = {
  flex: '1'
}

const iconContainer = {
  flexShrink: '0'
}

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

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        {/* Row 1: Location and IP */}
        <div style={infoGrid}>
          <div style={infoItem}>
            <div style={infoItemContent}>
              <div style={iconContainer}>
                <Img
                  src="https://keyshadeglobal.blob.core.windows.net/assets/map.png"
                  alt="Location"
                  style={iconStyle}
                />
              </div>
              <div style={infoContent}>
                <Text style={{ ...text, margin: '0', lineHeight: '1.3' }}>
                  Location
                  <br />
                  <strong>{location}</strong>
                </Text>
              </div>
            </div>
          </div>

          <div style={infoItem}>
            <div style={infoItemContent}>
              <div style={iconContainer}>
                <Img
                  src="https://keyshadeglobal.blob.core.windows.net/assets/laptop.png"
                  alt="IP Address"
                  style={iconStyle}
                />
              </div>
              <div style={infoContent}>
                <Text style={{ ...text, margin: '0', lineHeight: '1.3' }}>
                  IP address
                  <br />
                  <strong>{ip}</strong>
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Date and Time */}
        <div style={infoGrid}>
          <div style={infoItem}>
            <div style={infoItemContent}>
              <div style={iconContainer}>
                <Img
                  src="https://keyshadeglobal.blob.core.windows.net/assets/calendar.png"
                  alt="Date"
                  style={iconStyle}
                />
              </div>
              <div style={infoContent}>
                <Text style={{ ...text, margin: '0', lineHeight: '1.3' }}>
                  Date
                  <br />
                  <strong>{date}</strong>
                </Text>
              </div>
            </div>
          </div>

          <div style={infoItem}>
            <div style={infoItemContent}>
              <div style={iconContainer}>
                <Img
                  src="https://keyshadeglobal.blob.core.windows.net/assets/timer.png"
                  alt="Time"
                  style={iconStyle}
                />
              </div>
              <div style={infoContent}>
                <Text style={{ ...text, margin: '0', lineHeight: '1.3' }}>
                  Time
                  <br />
                  <strong>{time}</strong>
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: OS and Browser */}
        <div style={infoGrid}>
          <div style={infoItem}>
            <div style={infoItemContent}>
              <div style={iconContainer}>
                <Img
                  src="https://keyshadeglobal.blob.core.windows.net/assets/cpu.png"
                  alt="Operating System"
                  style={iconStyle}
                />
              </div>
              <div style={infoContent}>
                <Text style={{ ...text, margin: '0', lineHeight: '1.3' }}>
                  OS
                  <br />
                  <strong>{os}</strong>
                </Text>
              </div>
            </div>
          </div>

          <div style={infoItem}>
            <div style={infoItemContent}>
              <div style={iconContainer}>
                <Img
                  src="https://keyshadeglobal.blob.core.windows.net/assets/global.png"
                  alt="Browser"
                  style={iconStyle}
                />
              </div>
              <div style={infoContent}>
                <Text style={{ ...text, margin: '0', lineHeight: '1.3' }}>
                  Browser
                  <br />
                  <strong>{browser}</strong>
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security notice section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginTop: '30px',
          marginBottom: '20px',
          gap: '15px'
        }}
      >
        <div style={iconContainer}>
          <Img
            src="https://keyshadeglobal.blob.core.windows.net/assets/alert.png"
            alt="Security"
            style={{ width: '45px', height: '45px', marginRight: '16px' }}
          />
        </div>
        <div>
          <Text style={{ ...text, margin: '0' }}>
            <span style={h2}>Not you?</span>
            <br />
            take a few minutes to secure your account.
          </Text>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <Button href="#" style={ctaButton}>
          Check Login Activity
        </Button>
      </div>
    </BaseEmailTemplate>
  )
}

export default LoginNotificationEmail
