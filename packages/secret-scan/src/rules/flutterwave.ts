// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function flutterwave(): RegExp[] {
  return [
    /FLWPUBK_TEST-[a-h0-9]{32}-X/i, // Flutterwave public key regex
    /FLWSECK_TEST-[a-h0-9]{32}-X/i, // Flutterwave Secret key regex
    /FLWSECK_TEST-[a-h0-9]{12}/i // Flutterwave Encryption key regex
  ]
}

const testcase: TestCase[] = [
  {
    input: 'FLWPUBK_TEST-gdg9d8ca68b9d6ce0de4f77hahc3gga6-X',
    expected: true
  },
  {
    input: 'FLWSECK_TEST-0ae285010b1e52f1f1ba6f24655g70f8-X',
    expected: true
  },
  {
    input: 'FLWSECK_TEST-67635h4h6360',
    expected: true
  },
  {
    input: 'const = FLUTTERWAVE_SECRET_KEY',
    expected: false
  },
  {
    input: 'FLWSECK_TEST-',
    expected: false
  },
  {
    input: 'FLWPUBK_TEST-',
    expected: false
  }
]

flutterwave.testcases = testcase
