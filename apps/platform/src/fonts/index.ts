// eslint-disable-next-line camelcase -- this is a font import
import { Nunito_Sans, Geist } from 'next/font/google'

const GeistSansFont = Geist({
  subsets: ['latin']
})

const NunitoSansFont = Nunito_Sans({
  display: 'swap',
  weight: ['1000', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin']
})

export { GeistSansFont, NunitoSansFont }
