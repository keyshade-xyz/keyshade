import Image from 'next/image'
import { Inter, Poppins } from 'next/font/google'
import Links from './components/Links'
import Killers from './components/Killers'
const inter = Inter({ subsets: ['latin'] })

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})
export default async function Index() {
  return (
    <div className="relative">
      <div className="absolute z-10 opacity-25">
        <section className="h-[100vh] w-screen bg-[radial-gradient(ellipse_at_top_center,_#999797_38.7%,#060b0e_80%)]"></section>
      </div>
      <div className="bg-[#0a0a0a] w-full min-h-screen flex justify-center items-center absolute">
        <div>
          <Image src="./grid.svg" alt="grid" fill />
        </div>
        <div>
          <Image src="./stars.svg" alt="stars" fill />
        </div>
        <div className="bg-transparent  w-fit h-[75%] flex flex-col p-1 mt-20 gap-10 z-20">
          <div className="flex flex-col items-center justify-center gap-10 min-w-screen">
            <div className="flex items-center justify-center">
              <Image src="./logo.svg" height={60} width={61} alt="logo" />
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
