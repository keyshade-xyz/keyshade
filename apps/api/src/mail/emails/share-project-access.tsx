import { Text } from '@react-email/components'
import { text } from './styles/common-styles'
import ShareBaseEmailTemplate from './components/share-base-email-template'

interface ShareProjectAccessEmailProps {
  data: {
    projectName: string
    expiresAt: Date
    url: string
  }
}

export const ShareProjectAccessEmail = ({
  data: { projectName, expiresAt, url }
}: ShareProjectAccessEmailProps) => {
  const initCommand = `keyshade init --link ${url}`

  return (
    <ShareBaseEmailTemplate
      previewText={`Access granted to project: ${projectName}`}
      heading="Project Access Shared"
    >
      <Text style={text}>
        You have been granted access to the project{' '}
        <strong>{projectName}</strong> on Keyshade.
      </Text>

      <Text style={text}>
        To initialize this project locally, run the following commands in your
        terminal:
      </Text>

      {/* CLI Command Box */}
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '20px'
        }}
      >
        <code
          style={{
            color: '#fff',
            fontSize: '13px',
            display: 'block',
            marginBottom: '8px'
          }}
        >
          {initCommand}
        </code>
        <code style={{ color: '#fff', fontSize: '13px', display: 'block' }}>
          keyshade run
        </code>
      </div>

      <Text style={text}>
        This is a one-time-only link. If the CLI command doesn't work, you can
        view the key directly here:
        <br />
        <a href={url} style={{ color: '#3b82f6', textDecoration: 'underline' }}>
          View Access Link
        </a>
      </Text>

      <Text
        style={{ ...text, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
      >
        This link will expire on{' '}
        {expiresAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </Text>
    </ShareBaseEmailTemplate>
  )
}

export default ShareProjectAccessEmail
