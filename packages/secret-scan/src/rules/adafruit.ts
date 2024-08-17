// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function adafruit(): RegExp[] {
  return [/adafruit[a-zA-Z0-9]{32}/i] // Adafruit secret keys are 32 characters long
}

const testcase: TestCase[] = [
  {
    input: 'adafruitGBWoV0UAltMF1nOG5T7sjFDZHrwoX7XN',
    expected: true
  },
  {
    input: 'adafruit1234567890123456789012345678',
    expected: false
  },
  {
    input: 'adafruit123',
    expected: false
  }
]

adafruit.testcases = testcase
