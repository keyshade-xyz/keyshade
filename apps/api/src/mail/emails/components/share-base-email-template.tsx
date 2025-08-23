import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'
import {
  banner,
  container,
  content,
  footer,
  footerBanner,
  footerlogo,
  footerSocial,
  footerSocialIcon,
  footerTextBody,
  footerTextHead,
  h1,
  link,
  main
} from '../styles/common-styles'

interface ShareBaseEmailTemplateProps {
  previewText: string
  heading: string
  children: React.ReactNode
}

export const ShareBaseEmailTemplate: React.FC<ShareBaseEmailTemplateProps> = ({
  previewText,
  heading,
  children
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={banner}>
            <img
              src="https://keyshadeglobal.blob.core.windows.net/assets/email-banner.png"
              alt="Keyshade banner"
            />
          </Section>

          <div style={content}>
            <Heading style={h1}>{heading}</Heading>
            {children}
          </div>

          <div style={footerBanner}>
            <div style={footerlogo}>
              <img
                src="https://keyshadeglobal.blob.core.windows.net/assets/logo-transparent.png"
                alt="keyshade"
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'end',
                alignItems: 'center',
                width: 'fit-content'
              }}
            >
              <div style={footerSocial}>
                <a href="https://www.youtube.com/@keyshade_xyz" target="_blank">
                  <div style={footerSocialIcon}>
                    <img
                      src="https://keyshadeglobal.blob.core.windows.net/assets/yt.png"
                      alt="youtube"
                    />
                  </div>
                </a>
                <a href="https://x.com/keyshade_xyz" target="_blank">
                  <div style={footerSocialIcon}>
                    <img
                      src="https://keyshadeglobal.blob.core.windows.net/assets/xlogo.png"
                      alt="X"
                    />
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/company/keyshade-xyz"
                  target="_blank"
                >
                  <div style={footerSocialIcon}>
                    <img
                      src="https://keyshadeglobal.blob.core.windows.net/assets/linkedin.png"
                      alt="linkedin"
                    />
                  </div>
                </a>
                <a
                  href="https://www.instagram.com/keyshade_xyz/"
                  target="_blank"
                >
                  <div style={footerSocialIcon}>
                    <img
                      src="https://keyshadeglobal.blob.core.windows.net/assets/insta.png"
                      alt="instagram"
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              width: '85%',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                width: '50%'
              }}
            >
              <Text style={footerTextBody}>Making .env great again.</Text>
              <Text style={footerTextHead}>More about us</Text>
            </div>
            <div
              style={{
                width: '50%',
                display: 'flex',
                justifyContent: 'end'
              }}
            >
              <div
                style={{
                  width: '100%'
                }}
              >
                <div
                  style={{
                    ...footerTextBody,
                    textAlign: 'end',
                    width: '100%'
                  }}
                >
                  Outbaksho PVT LTD
                  <br />
                  Patulia Panchyet More, Old Calcutta Road,
                  <br />
                  Khardaha, North 24 Paganas, Kol-70019
                  <br />
                  West Bengal, India
                </div>
              </div>
            </div>
          </div>

          <Section style={footer}>
            <Text style={{ ...footerTextBody, textAlign: 'center' }}>
              This is an automated message. Please do not reply to this email.
              <br />
              Read our{' '}
              <Link href="https://www.keyshade.xyz/privacy" style={link}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="https://www.keyshade.xyz/terms_and_condition"
                style={link}
              >
                Terms and Conditions
              </Link>{' '}
              for more information on how we manage your data and services.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ShareBaseEmailTemplate
