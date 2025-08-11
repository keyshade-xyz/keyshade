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
      previewText="A secret is waiting for you!"
      heading="A secret is waiting for you!"
    >
      <Text style={text}>
        someone has shared a secret with you over keyshade.
      </Text>
      <Text style={text}>
        you can access it securely by clicking the button below. In case it
        doesn't work, you can head over to this link:{' '}
        <a href={url}>View Secret</a>
      </Text>
      {isPasswordProtected && (
        <Text style={text}>The secret is password protected</Text>
      )}
      <Text style={text}>
        The secret will be available until{' '}
        <strong>
          {expiresAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </strong>
      </Text>
    </BaseEmailTemplate>
  )
}

export default ShareSecretEmailTemplate
