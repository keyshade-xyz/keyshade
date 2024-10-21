// keyshade-ignore-all
// TODO: Fix this regex, it's breaking almost other rules

import type { TestCase } from '@/types'

export default function cloudflare(): RegExp[] {
  /*
   * It covers three keys
   * 1. CLOUDFLARE_GLOBAL_API_KEY
   * 2. CLOUDFLARE_API_KEY
   * 3. CLOUDFLARE_ORIGIN_CA
   * */
  return [
    // Cloudflare key regex
    /(?:[a-z0-9]{37}|[a-zA-Z0-9=_-]{40}|v1\.0-[a-f0-9]{24}-[a-f0-9]{146})/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'bXuvOa1eAdlEhLcdwb30p3ypndgekbi8a2X2jqqo',
    expected: true
  },
  {
    input: '5p7tz9ttp5whouvauplfl2w46iusgu17yw9k7',
    expected: true
  },
  {
    input:
      'v1.0-d9fb3ee37d05dc93c20517cb-0a18e97249c3d60d8654a94361a4b22272f0fdfca7d5238b319844a522929b878286e10fc117346650476342d6c585f2d215ad22153bcb9b0a65269823db7dc2b478773e998cc58015',
    expected: true
  },
  {
    input: '6v2uj0uq3vk2k1v3xeb5xjqkzmy7h5tmbrene',
    expected: true
  },
  {
    input:
      'v1.0-f7a670bb0f7de7e321da97ad-1d267bba798374e71ee0172a2c375325147f8c92da44a078fe82d431bfb2a329ce82e50bff94cec987c56a363af69dc08d175090a9ce4dd949af63ab75515e5acba1870a154eb3108b',
    expected: true
  },
  {
    input: 'q7l080tpm9bqgo1crrfczvvul1tcn0sktliry',
    expected: true
  },
  {
    input:
      'c2357643gjhdwgufjebsaiydfjkdsyufkefsdfjdsgkfgegfuefjhgeufjewbfewhvfhgfygeygfyu7ndvsgfjsevfvsdjfjvfvhgwghvejsuvuisdgfhvjffsdbfhgfhsberhwegurggefjvwefhrenbuy8er8u8uworu9euw9herhfbuyegfbsggehgerhiyerhrbhiwpwoerueh83u20--13u3r982834yreufy9p2--213883hr73230u201239ui3482hih2y4h',
    expected: false
  },
  {
    input: 'ca',
    expected: false
  },
  {
    input: 'CLOUDFLARE_GLOBAL_API_KEY',
    expected: false
  },
  {
    input: 'CLOUDFLARE_API_KEY',
    expected: false
  },
  {
    input: 'CLOUDFLARE_ORIGIN_CA',
    expected: false
  },
  {
    input: 'CLOUDFLARE',
    expected: false
  }
]

cloudflare.testcases = testcase
