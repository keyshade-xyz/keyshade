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
  footerContainer,
  footerInfoSection,
  footerlogo,
  footerSocial,
  footerSocialIcon,
  footerTextBody,
  footerTextHead,
  h1,
  link,
  main
} from '../styles/common-styles'

interface BaseEmailTemplateProps {
  previewText: string
  heading: string
  children: React.ReactNode
}

export const BaseEmailTemplate: React.FC<BaseEmailTemplateProps> = ({
  previewText,
  heading,
  children
}) => {
  const socials = [
    {
      alt: 'youtube',
      href: 'https://www.youtube.com/@keyshade_xyz',
      src: 'https://keyshadeglobal.blob.core.windows.net/assets/yt.png'
    },
    {
      alt: 'X',
      href: 'https://x.com/keyshade_xyz',
      src: 'https://keyshadeglobal.blob.core.windows.net/assets/xlogo.png'
    },
    {
      alt: 'linkedin',
      href: 'https://www.linkedin.com/company/keyshade-xyz',
      src: 'https://keyshadeglobal.blob.core.windows.net/assets/linkedin.png'
    },
    {
      alt: 'instagram',
      href: 'https://www.instagram.com/keyshade_xyz/',
      src: 'https://keyshadeglobal.blob.core.windows.net/assets/insta.png'
    }
  ]

  const footerLegalLinks = {
    privacyPolicy: {
      href: 'https://www.keyshade.xyz/privacy',
      text: 'Privacy Policy'
    },
    termsAndConditions: {
      href: 'https://www.keyshade.xyz/terms_and_condition',
      text: 'Terms and Conditions'
    },
    unsubscribe: { href: '#', text: 'Unsubscribe' }
  }

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
            <div style={footerContainer}>
              <div style={footerSocial}>
                {socials.map(({ alt, href, src }) => (
                  <a href={href} target="_blank" key={alt}>
                    <div style={footerSocialIcon}>
                      <img src={src} alt={alt} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={footerInfoSection}>
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
              <Link href={footerLegalLinks.privacyPolicy.href} style={link}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href={footerLegalLinks.termsAndConditions.href}
                style={link}
              >
                Terms and Conditions
              </Link>{' '}
              for more information on how we manage your data and services.{' '}
              <Link href={footerLegalLinks.unsubscribe.href} style={link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default BaseEmailTemplate
