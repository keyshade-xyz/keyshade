// keyshade-ignore-all
import type { TestCase } from '@/types'

/**
 * ref. https://community.openai.com/t/what-are-the-valid-characters-for-the-apikey/288643
 *
 * User api keys (legacy): 'sk-[20 alnum]T3BlbkFJ[20 alnum]'
 *
 * Project-based api keys: 'sk-[project-name]-[20 alnum]T3BlbkFJ[20 alnum]'
 */
export default function openAI(): RegExp[] {
  return [/sk-[A-Za-z0-9-_]*[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}/]
}

const testcase: TestCase[] = [
  {
    input: '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',
    expected: true
  },
  {
    input: 'sk-Keyshade-KZzblv156jfkhLYqWYJ7T3BlbkFJI83yPN3Y29BPdeMKdFwb',
    expected: true
  },
  {
    input: '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',
    expected: true
  },
  {
    input:
      'this is a key = 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',
    expected: true
  },
  {
    input: 'const key=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',
    expected: true
  },
  {
    input: 'sk-Keyshade-F4N8V5k9R1P3H7L2W8T3BlbkFJb9K6Y2xF7Z1T3W',
    expected: false
  },
  {
    input: 'sk-M9J2X1V8Q6W7T5R4L3HtT3BlbkFJZ0N8P5K6S3W2B7',
    expected: false
  },
  {
    input: 'sk-keyshade-1947-P5L2R7W8N3K6V9X0J1T3BlbkFJG4Y5H2M9Q8F6D1',
    expected: false
  },
  {
    input: 'sk-teri-maka-sakinaka',
    expected: false
  },
  {
    input: 'I am iron man',
    expected: false
  }
]

openAI.testcases = testcase
