// keyshade-ignore-all
import type { TestCase } from '@/types'

/**
 * Discord Bot Token ([M|N|O]XXXXXXXXXXXXXXXXXXXXXXX[XX].XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXX)
 * Reference: https://discord.com/developers/docs/reference#authentication
 * Also see: https://github.com/Yelp/detect-secrets/issues/627
 */
export default function discord(): RegExp[] {
  return [/[MNO][a-zA-Z\d_-]{23,25}\.[a-zA-Z\d_-]{6}\.[a-zA-Z\d_-]{27}/]
}

const testcase: TestCase[] = [
  {
    input: 'MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs',
    expected: true
  },
  {
    input: 'Nzk5MjgxNDk0NDc2NDU1OTg3.YABS5g.2lmzECVlZv3vv6miVnUaKPQi2wI',
    expected: true
  },
  {
    input: 'MZ1yGvKTjE0rY0cV8i47CjAa.uRHQPq.Xb1Mk2nEhe-4iUcrGOuegj57zMC',
    expected: true
  },
  {
    input: 'OTUyNED5MDk2MTMxNzc2MkEz.YjESug.UNf-1GhsIG8zWT409q2C7Bh_zWQ',
    expected: true
  },
  {
    input:
      'OTUyNED5MDk2MTMxNzc2MkEz.GSroKE.g2MTwve8OnUAAByz8KV_ZTV1Ipzg4o_NmQWUMs',
    expected: true
  },
  {
    input:
      'MTAyOTQ4MTN5OTU5MTDwMEcxNg.GSwJyi.sbaw8msOR3Wi6vPUzeIWy_P0vJbB0UuRVjH8l8',
    expected: true
  },
  {
    input:
      'ATMyOTQ4MTN5OTU5MTDwMEcxNg.GSwJyi.sbaw8msOR3Wi6vPUzeIWy_P0vJbB0UuRVjH8l8',
    expected: true
  },
  {
    input:
      '=MTAyOTQ4MTN5OTU5MTDwMEcxN.GSwJyi.sbaw8msOR3Wi6vPUzeIWy_P0vJbB0UuRVjH8l8',
    expected: true
  },
  {
    input:
      'MTAyOTQ4MTN5OTU5MTDwMEcxNg.YjESug.UNf-1GhsIG8zWT409q2C7Bh_zWQ!4o_NmQWUMs',
    expected: true
  },
  {
    input: 'MZ1yGvKTj0rY0cV8i47CjAa.uHQPq.Xb1Mk2nEhe-4icrGOuegj57zMC',
    expected: false
  },
  {
    input: 'MZ1yGvKTj0rY0cV8i47CjAa.uRHQPq.Xb1Mk2nEhe-4iUcrGOuegj57zMC',
    expected: false
  },
  {
    input: 'MZ1yGvKTjE0rY0cV8i47CjAa.uHQPq.Xb1Mk2nEhe-4iUcrGOuegj57zMC',
    expected: false
  },
  {
    input: 'MZ1yGvKTjE0rY0cV8i47CjAa.uRHQPq.Xb1Mk2nEhe-4iUcrGOuegj57zM',
    expected: false
  },
  {
    input: 'MZ1yGvKTjE0rY0cV8i47CjAa.uRHQPq.Xb1Mk2nEhe,4iUcrGOuegj57zMC',
    expected: false
  },
  {
    input: 'PZ1yGvKTjE0rY0cV8i47CjAa.uRHQPq.Xb1Mk2nEhe-4iUcrGOuegj57zMC',
    expected: false
  },
  {
    input:
      'MTAyOTQ4MTN5OTU5MTDwMEcxNg0.GSwJyi.sbaw8msOR3Wi6vPUzeIWy_P0vJbB0UuRVjH8l8',
    expected: false
  }
]

discord.testcases = testcase
