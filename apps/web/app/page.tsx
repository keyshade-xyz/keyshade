
import { Poppins } from 'next/font/google'
import Links from './components/Links'
import Killers from './components/Killers'
import { Logo, Grid, Stars } from '../public'
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})
export default async function Index() {
  return (
    <div className="relative">
      <div className="absolute z-10 opacity-25">
        <section className="h-[100vh] w-screen bg-[radial-gradient(ellipse_at_top_center,_#fff_20%,#ff03080B_80%)] opacity-50" />
      </div>
      <div className="bg-[#03080B] w-full min-h-screen flex justify-center items-center absolute">
        <Grid className="h-[69.16vh] w-[61.23vw] absolute " />
        <Stars className='h-[47.51vh] w-[87.92vw] absolute overflow-hidden' />
        <div className="bg-transparent  w-fit h-[75%] flex flex-col p-1 mt-20 gap-10 z-20">
          <div className="flex flex-col items-center justify-center gap-10 min-w-screen">
            <div className="flex items-center justify-center">
              <Logo />
              <h1
                className={`px-4 bg-gradient-to-br from-[#727576] to-[#fafafb] inline-block text-transparent bg-clip-text text-6xl ${poppins.className} py-1  md:text-5xl lg:text-7xl`}
              >
                keyshade.xyz
              </h1>
            </div>

            <div className="flex items-center justify-center py-4">
              <p className="p-1 min-w-[55%] sm:w-full md:w-[50%] lg:w-[35%] items-center justify-center bg-gradient-to-br from-[#727576] to-[#fafafb] inline-block text-transparent bg-clip-text text-wrap  text-center text-md">
                Manage all your secrets securely with public key encryption and
                realtime based tools, that seamlessly fits into your codebase
              </p>
            </div>

            <div className="flex gap-10 items-center justify-center">
              <Links icon='docs' description='Documentation' link='https://docs.keyshade.xyz/' />
              <Links icon='github' description='Star on Github' link='https://github.com/keyshade-xyz/keyshade' />
            </div>

            <div className="flex items-center justify-center gap-24 mt-20">
              <Killers image='kriptonian' twitterUserName='kriptonian8' />
              <Killers image='rajdip-b' twitterUserName='RajB47' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
