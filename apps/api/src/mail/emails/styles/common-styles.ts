import { CSSProperties } from 'react'

export const main: CSSProperties = {
  fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  lineHeight: '1.6',
  color: '#04050a',
  backgroundColor: '#fafafa',
  margin: '0',
  padding: '20px'
}

export const container: CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '5px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
}

export const content: CSSProperties = {
  padding: '20px 40px'
}

export const h1: CSSProperties = {
  color: '#000',
  marginBottom: '20px',
  fontSize: '24px',
  fontWeight: '600'
}

export const text: CSSProperties = {
  marginBottom: '5px',
  color: '#666'
}

export const workspaceDetails: CSSProperties = {
  width: '100%',
  backgroundColor: '#fafafa',
  borderRadius: '5px',
  margin: '20px 0px',
  padding: '10px 20px'
}

export const workspaceInfo: CSSProperties = {
  margin: '7px 0px'
}

export const ctaButton: CSSProperties = {
  width: '100px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  textAlign: 'center',
  marginTop: '10px',
  cursor: 'pointer',
  display: 'inline-block',
  backgroundColor: '#000',
  textDecoration: 'none',
  padding: '10px 22px',
  borderRadius: '5px'
}

export const footer: CSSProperties = {
  borderTop: '1px solid #eaeaea',
  padding: '20px'
}

export const footerText: CSSProperties = {
  fontSize: '12px',
  color: '#999',
  textAlign: 'center' as const,
  margin: '0'
}

export const link: CSSProperties = {
  color: '#000',
  textDecoration: 'underline'
}
