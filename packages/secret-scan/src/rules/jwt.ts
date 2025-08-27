// keyshade-ignore-all
import type { TestCase } from '@/types'

// Returns a function that returns an array of RegExp, but also attaches a filter for stricter JWT validation
import { Buffer } from 'buffer'

function isValidBase64Url(str: string) {
  // base64url: A-Za-z0-9-_ (no padding)
  return /^[A-Za-z0-9_-]+$/.test(str)
}

function decodeBase64Url(str: string) {
  // Pad to multiple of 4
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4 !== 0) s += '='
  try {
    return Buffer.from(s, 'base64').toString('utf8')
  } catch {
    return null
  }
}

function isValidJwt(match: string): boolean {
  const parts = match.split('.')
  if (parts.length !== 2 && parts.length !== 3) return false
  if (!parts.every(isValidBase64Url)) return false
  // Decode header and payload
  let header, payload
  try {
    header = JSON.parse(decodeBase64Url(parts[0]) || '')
    payload = JSON.parse(decodeBase64Url(parts[1]) || '')
  } catch {
    return false
  }
  // Header must be object with alg and typ
  if (!header || typeof header !== 'object' || !header.alg || !header.typ) {
    return false
  }
  // Payload must be object
  if (!payload || typeof payload !== 'object') return false
  return true
}

function jwt(): RegExp[] {
  // Initial regex: eyJ, two or three segments, base64url chars
  const regex = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)?/g
  ;(regex as any).filter = isValidJwt
  return [regex]
}
export default jwt

const testcase: TestCase[] = [
  {
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expected: true
  },
  {
    input:
      'eyJ0eXAiOiJKV1QiLA0KImFsZyI6IkhTMjU2In0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    expected: true
  },
  {
    input:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9lIiwKInN0YXR1cyI6ImVtcGxveWVlIgp9',
    expected: true
  },
  {
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IsWww6HFkcOtIMOWxZHDqcOoIiwiaWF0IjoxNTE2MjM5MDIyfQ.k5HibI_uLn_RTuPcaCNkaVaQH2y5q6GvJg8GPpGMRwQ',
    expected: true
  },
  {
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expected: true
  },
  {
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    expected: true
  },
  {
    input:
      '{"alg":"HS256","typ":"JWT"}.{"name":"Jon Doe"}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expected: false
  },
  {
    input:
      'bm90X3ZhbGlkX2pzb25fYXRfYWxs.bm90X3ZhbGlkX2pzb25fYXRfYWxs.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expected: false
  },
  {
    input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    expected: false
  },
  {
    input: 'jwt',
    expected: false
  },
  {
    input:
      'eyJhbasdGciOiJIUaddasdasfsasdasdzI1NiIasdsInR5cCI6IkpXVCasdJasd9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expected: false
  },
  {
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expected: false
  },
  {
    input: 'eyJAAAA.eyJBBB',
    expected: false
  },
  {
    input: 'eyJBB.eyJCC.eyJDDDD',
    expected: false
  }
]

jwt.testcases = testcase
