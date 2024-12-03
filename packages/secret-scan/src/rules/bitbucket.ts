// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function bitbucket(): RegExp[] {
  return [
    // BitBucket key regex
    /bitbucket[a-zA-Z0-9]{32}|bitbucket[a-zA-Z0-9=_-]{64}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'bitbucketaP9GcNpaWaX3nGwbBSYIGxVKb23PfABh',
    expected: true
  },
  {
    input:
      'bitbucketI8rtKWnU-hHJuFNaY_cVrPlFulcTFQT=qYwSXLwW9-69XzdR1ivUSmtop1b6mrCX',
    expected: true
  },
  {
    input:
      'bitbucketOi=XuIk3yALKtwdNMJBoyaG3nJ0AQDL5Hr-9bN9eh0J_W4818YHGIPLWCu3TVYyB',
    expected: true
  },
  {
    input:
      'bitbuckete7fg_=_gOBjbbqJgDGDWyUG8e38a2StbEvllkc6d3_QxKAYdcq5EVZTY4TANrAkw',
    expected: true
  },
  {
    input:
      'bitbucket1TNov1LIYBgHTwLzvjQSByUV5Xux3mFZWO38dwIHy98l_5EfAIVB=AHVzQiKyG4Z',
    expected: true
  },
  {
    input:
      'bitbucketAyBGxwkWYcb26PxsNSAu5siG5XT=Jgb__FDPVxC-PCAJT2T57YqhkvWRjKKxALwi',
    expected: true
  },
  {
    input: 'bitbucket0miEtiMhGZuS5CRENfhdkSRmCdKXr8KZ',
    expected: true
  },
  {
    input:
      'bitbucket1O_2D5VrXBcD-IEOyBn_KvAUYuKFxHYMEjlBf9l1pJS=27KlFUPWVD1eQ9eOwJw5',
    expected: true
  },
  {
    input: 'bitbucketLeSvbpwa5iK8XJli6swW1qidWR7b9rDX',
    expected: true
  },
  {
    input: 'bitbucketRSsSg2xwRDgT4PjJXMA5mJgfQKG8Z6lT',
    expected: true
  },
  {
    input: 'bitbucket2343283kjsgdfj',
    expected: false
  },
  {
    input: 'bitbucket',
    expected: false
  }
]

bitbucket.testcases = testcase
