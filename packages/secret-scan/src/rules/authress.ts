// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function authress(): RegExp[] {
  /*
		Authress API key regex

		reference: https://authress.io/knowledge-base/docs/authorization/service-clients/secrets-scanning/#1-detection
	*/
  return [
    /(?:sc|ext|scauth|authress)_[a-z0-9]{5,30}\.[a-z0-9]{4,6}\.acc[_-][a-z0-9-]{10,32}\.[a-z0-9+/_=-]{30,120}/i
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'authress_cq4l7vgvljx.qaby.acc_lakpdsidyhj8vax65r.o-c+4qkjwxphlw127i61yx2=b80_i5ntl4-v6msljbe3byg-qrclhj+z8xi4/7k44eggxhq3s/xhqq_gebbcn30',
    expected: true
  },
  {
    input:
      'ext_0pvh07lxyp5.27xvn.acc_36z1ljwo-a.w5i8+a44eldg/rpwftte0lbz65w+1/iv03rh34806avq912hi=k36bihcwip55uizytt8tumzw-eri+a/8-/70_y',
    expected: true
  },
  {
    input:
      'authress_eu61hvi5ya0blyssax3o8d3jo.t0v24.acc-l1w7hnjpehqhpab5lhkb.hkgj6q57tiwfo-k_2j-nxs4twnn6vhfmj9qiusk',
    expected: true
  },
  {
    input:
      'sc_m2ue9panmg89f65xox6tzy.pu3q.acc_rtzskra-wa061t-0cyic9st.a1m/87ffz8f1bjg8-esv0b3gciyskefl',
    expected: true
  },
  {
    input:
      'authress_xme04dm9jxknhtsm8rtjbqkdbbe.wp0zo.acc_r3yvcifffw21nrzivzut.z5ks9/wem41yup21c7-w4_d4rcnvdm/n=+yi+ipoxszw1+6_qtgg_tl8/9ac8tv6+d',
    expected: true
  },
  {
    input:
      'ext_jovb0t8eio0g9i.b6c3.acc-5ys8gxhc4966u3i3d2kszi7dkdim.kvm=9=06068=375id3p8kq8kq8b-m9k',
    expected: true
  },
  {
    input:
      'ext_k7vh1dqads9bwz.w2do38.acc_4d3l3c9l42xgjmponm4t.nd6qlsi7gl/k1gli3f7osbrhwwa0_bdgiiybg7iijfg+5589fqdfgv-',
    expected: true
  },
  {
    input:
      'scauth_11hawttghpfqac8etxwupjo26bb9q.tr6i.acc_kw7ot9unhg65f.d-=60z7ugbdh=cv5m5av-ug0gunbrvfz8ls484v_w97sser2bss6x/xu8s0zoa7ly-kn994ifj_ktebwd2z6_5y3/5w7ujgb7k=_',
    expected: true
  },
  {
    input:
      'ext_hsxf9loqwm6gcagmsa3bd5f9.wtadhc.acc_c--dx75fnms1htfw03.s_bck7=37a__7y9uqruz4uwl3-jw3s4o50hhsqmkair+9/6ny3bczw0mn/vadmv_mwo9a/2k_xlkfso1k6j61fzp59b_utpj2',
    expected: true
  },
  {
    input:
      'scauth_ol3j5c7k.ur8aox.acc_8uxa-qc1-03ny3dd3mp8l0be.yy0ulnk0s9=13h2q934zdptue9mw4jlic1su8u2q8+4drjz3=1ot',
    expected: true
  },
  {
    input: 'authress_invalid_key',
    expected: false
  },
  {
    input: 'ext_12345.invalid.acc_1234567890.invalid',
    expected: false
  },
  {
    input: 'scauth_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'sc_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'authress_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'ext_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'scauth_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'authress_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'ext_12345.1234.acc_1234567890.1234567890',
    expected: false
  },
  {
    input: 'scauth_12345.1234.acc_1234567890.1234567890',
    expected: false
  }
]

authress.testcases = testcase
