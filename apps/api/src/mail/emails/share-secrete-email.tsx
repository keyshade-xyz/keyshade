import { Text } from '@react-email/components'
import { text } from './styles/common-styles'
import BaseEmailTemplate from './components/base-email-template'

interface ShareSecretEmailTemplateProps {
  data: {
    expiresAt: Date
    isPasswordProtected: boolean
    url: string
  }
}

export const ShareSecretEmailTemplate = ({
  data: { expiresAt, isPasswordProtected, url }
}: ShareSecretEmailTemplateProps) => {
  return (
    <BaseEmailTemplate
      previewText="A secret has been shared with you over Keyshade!"
      heading="A secret has been shared with you over Keyshade!"
    >
      <Text style={text}>
        Someone has shared a secret with your over keyshade
      </Text>
      <Text style={text}>The secret is accessible at {url}</Text>
      {isPasswordProtected && (
        <Text style={text}>The secret is password protected</Text>
      )}
      <Text style={text}>
        The secret will be available until{' '}
        <strong>{expiresAt.toDateString()}</strong>
      </Text>
    </BaseEmailTemplate>
  )
}

export default ShareSecretEmailTemplate
