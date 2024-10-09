// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function planetscale(): RegExp[] {
  return [
    // Planetscale Password regex
    /pscale_pw_[a-z0-9=\-_\.]{32,64}/i,

    // Planetscale API Token Regex
    /pscale_tkn_[a-z0-9=\-_\.]{32,64}/i,

    // Planetscale OAuth Token Regex
    /pscale_oauth_[a-z0-9=\-_\.]{32,64}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'pscale_pw_ajpcyf4c=r6lb-io9o2.7-epuvojus8f4horjaq9f3895.6l',
    expected: true
  },
  {
    input: 'pscale_pw_9c5mf807yeygid-jzx24q-2x_u94451-.4qt76m8p7imt0',
    expected: true
  },
  {
    input: 'pscale_tkn_lpy9d_khrord04559x6bdzyrgj38nb_4koqkic',
    expected: true
  },
  {
    input:
      'pscale_tkn_zhrzrex23933m5_a3p-vf.vz55ylj3urc4olnter_twvgzujtu._hn3q8l2htdw',
    expected: true
  },
  {
    input: 'pscale_oauth_k-5wwis--9jp1othxh8rrlkqgiv3acoorg0sklcjo',
    expected: true
  },
  {
    input: 'pscale_oauth_dxo=v081vsv10emho_5uj-8xj8=5.upl369nvhwdql8u3x_17mzm',
    expected: true
  }
]

planetscale.testcases = testcase
