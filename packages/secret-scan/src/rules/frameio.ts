// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function frameio(): RegExp[] {
  return [
    /fio-u-[a-z0-9\-_=]{64}/i // FrameIO API Token regex
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'fio-u-bgcrq_d-3wf715y77ftxqyt5mtuvc9y0914zzot514=wz0301mnmda7z-75sahhc',
    expected: true
  },
  {
    input:
      'fio-u-rw0k9va933_8vp0zefnlq-f0-n0ld1=h98z=teeebnph5qpnkftltfh3olavw9id',
    expected: true
  },
  {
    input:
      'fio-u-da94y-7vmtkb_bmu=lt3i4_1aesayge67ghj2by7p3mv8d50plsbro4sg7iebv4k',
    expected: true
  },
  {
    input: 'fio-u-',
    expected: false
  },
  {
    input: 'const = FRAMEIO_API_TOKEN',
    expected: false
  },
  {
    input: 'frameio',
    expected: false
  },
  {
    input: 'fio',
    expected: false
  }
]

frameio.testcases = testcase
