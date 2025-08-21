import { CSSProperties } from 'react'

export const main: CSSProperties = {
  fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  lineHeight: '1.6',
  color: '#000000',
  margin: '0',
  padding: '20px'
}

export const container: CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#EFFCFF',
  borderRadius: '5px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
}

export const content: CSSProperties = {
  padding: '0 50px',
  paddingBottom: '20px'
}

export const h1: CSSProperties = {
  color: '#125D67',
  marginBottom: '20px',
  fontSize: '40px',
  fontWeight: '700'
}
export const h2: CSSProperties = {
  color: '#125D67',
  marginBottom: '20px',
  fontSize: '24px',
  fontWeight: '600'
}

export const text: CSSProperties = {
  marginBottom: '5px',
  color: '#666'
}
export const textLogin: CSSProperties = {
  margin: 0,
  color: '#666',
  lineHeight: '1.4'
}

export const workspaceDetails: CSSProperties = {
  width: '100%',
  borderRadius: '5px',
  margin: '20px 0px',
  padding: '10px 20px',
  border: '1px solid #eee',
  backgroundColor: '#fafafa'
}

export const workspaceInfo: CSSProperties = {
  margin: '7px 0px'
}

export const ctaButton: CSSProperties = {
  width: 'fit-content',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '500',
  textAlign: 'center',
  marginTop: '10px',
  marginRight: '10px',
  cursor: 'pointer',
  display: 'inline-block',
  backgroundColor: '#125D67',
  textDecoration: 'none',
  padding: '10px 22px',
  borderRadius: '5px'
}

export const otpStyle: CSSProperties = {
  ...workspaceInfo,
  fontSize: '26px',
  textAlign: 'center',
  letterSpacing: '8px'
}

export const banner: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px 20px',
  width: '100%'
}

export const footer: CSSProperties = {
  borderTop: '1px solid #eaeaea',
  padding: '20px',
  width: '95%',
  margin: '0, auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

export const footerBanner: CSSProperties = {
  borderTop: '1px solid #eaeaea',
  borderBottom: '1px solid #eaeaea',
  padding: '20px',
  margin: '0 auto',
  width: '90%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

export const footerlogo: CSSProperties = {
  width: '75%',
  display: 'flex',
  justifyContent: 'end',
  alignItems: 'center',
  height: '25px'
}

export const footerSocial: CSSProperties = {
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  gap: '10px'
}
export const footerSocialIcon: CSSProperties = {
  padding: '10px',
  justifyContent: 'center',
  alignItems: 'center',
  display: 'flex',
  borderRadius: '50%',
  border: '1px solid #ccc'
}

export const footerTextBody: CSSProperties = {
  fontSize: '12px',
  color: '#00000099',
  margin: '0'
}
export const footerTextHead: CSSProperties = {
  fontSize: '13px',
  color: '#000000',
  margin: '0'
}

export const link: CSSProperties = {
  color: '#000',
  textDecoration: 'underline'
}

export const iconStyle = {
  width: '24px',
  height: '24px',
  padding: '5px',
  borderRadius: '16px',
  backgroundColor: '#F7FAFF',
  marginRight: '10px'
}
