import { GeistSans } from 'geist/font/sans'
// eslint-disable-next-line camelcase -- this is a font import
import { Nunito_Sans } from 'next/font/google'

const GeistSansFont = GeistSans

const NunitoSansFont = Nunito_Sans({
  display: 'swap',
  weight: ['1000', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin']
})

export { GeistSansFont, NunitoSansFont }
