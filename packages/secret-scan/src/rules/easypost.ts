// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function easypost(): RegExp[] {
  return [
    /\bEZAK[a-z0-9]{54}/i, // Easypost API Token regex
    /\bEZTK[a-z0-9]{54}/i // Easypost Test API Token regex
  ]
}

const testcase: TestCase[] = [
  {
    input: 'EZAK2fdhpkemxyx0qaykdvzeqz8ot30kzbc8s46t2erpmireuylnjc3t9h', // Easypost API Token
    expected: true
  },
  {
    input: 'EZTKvoc505r1qjlmocerfnz61ce0hco00fdejxtjpfbebj5811e70wsmvm', // Easypost Test API Token
    expected: true
  },
  {
    input: 'EZTK',
    expected: false
  },
  {
    input: 'EZAK',
    expected: false
  },
  {
    input: 'const = EASYPOST_API_TOKEN',
    expected: false
  },
  {
    input: 'easypost',
    expected: false
  },
  {
    input: 'EZ',
    expected: false
  }
]

easypost.testcases = testcase
