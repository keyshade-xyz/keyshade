// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function postman(): RegExp[] {
  return [
    // Postman API Key regex
    /PMAK-[a-f0-9]{24}-[a-f0-9]{34}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'PMAK-9b918da2e43ee95b919224d1-e04a135eda41453c240886e79109bf6af3',
    expected: true
  },
  {
    input: 'PMAK-74b0ae4e463c8e190074daca-7cb16c6676b256ebd8b42ee55624ce4528',
    expected: true
  },
  {
    input: 'PMAK-',
    expected: false
  },
  {
    input: 'POSTMAN',
    expected: false
  }
]

postman.testcases = testcase
