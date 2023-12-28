import Image from "next/image"
import { Inter, Poppins } from "next/font/google"
const inter = Inter({ subsets: ['latin'] })

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
export default async function Index() {

  return (
    <div className="relative">
      <div className="absolute z-10 opacity-25">
        <section className="h-[100vh] w-screen bg-[radial-gradient(ellipse_at_top_center,_#999797_38.7%,#060b0e_80%)]">
        </section>
      </div>
      <div className="bg-[#0a0a0a] w-full min-h-screen flex justify-center items-center absolute">
        <div>
          <Image src='./grid.svg' alt="grid" fill></Image>
        </div>
        <div>
          <Image src='./stars.svg' alt="stars" fill></Image>
        </div>
        <div className="bg-transparent  w-fit h-[75%] flex flex-col p-1 mt-20 gap-10 z-20">

          <div className="flex flex-col items-center justify-center gap-10 min-w-screen">
            <div className="flex items-center justify-center">

              <Image src='./logo.svg' height={60} width={61} alt="logo" />
              <h1 className={`px-4 bg-gradient-to-br from-[#727576] to-[#fafafb] inline-block text-transparent bg-clip-text text-6xl ${poppins.className} py-1  md:text-5xl lg:text-7xl`}>keyshade.xyz</h1>
            </div>


            <div className="flex items-center justify-center py-4">
              <p className="p-1 min-w-[55%] sm:w-full md:w-[50%] lg:w-[35%] items-center justify-center bg-gradient-to-br from-[#727576] to-[#fafafb] inline-block text-transparent bg-clip-text text-wrap  text-center text-md">
                Manage all your secrets securely with public key encryption and realtime based tools, that seamlessly fits into your codebase
              </p>
            </div>

            <div className="flex gap-10 items-center justify-center">
              <div className={`flex place-items-center gap-2 justify-center rounded-full border-[#3a3e41] border-solid border-[1px] bg-gradient-to-b from-[#0d1215]/35 to-[#323638]/35 px-4 py-2 ${inter.className} cursor-pointer transition-all ease-in-out duration-200 hover:scale-105 `}>
                <Image src="./x_svg.svg" alt="x logo" height={13} width={13} ></Image>
                <p className="text-white text-sm">Follow us on X</p>
              </div>
              <a href="https://github.com/keyshade-xyz/keyshade" target="_blank">

                <div className={`flex place-items-center gap-2 justify-center rounded-full border-[#3a3e41] border-solid border-[1px] bg-gradient-to-b from-[#0d1215]/45 to-[#323638]/45 px-4 py-2 ${inter.className} cursor-pointer transition-all ease-in-out duration-200 hover:scale-105`}>
                  <Image src="./github.svg" alt="x logo" height={13} width={13} ></Image>
                  <p className="text-white text-sm">Star on GitHub</p>

                </div>
              </a>
            </div>

            <div className="flex items-center justify-center gap-24 mt-20">

              <div className="flex items-center justify-cente gap-2">
                <div className="flex justify-center items-center h-[48px] w-[48px] rounded-full border-[#3a3e41] border-solid border-[2px] bg-gradient-to-br from-[#181c20] to-[#282d31]">
                  <Image src="./sawan.svg" height={36} width={36} alt="sawan_bhattacharjee"></Image>
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-white text-sm">kriptonian</p>
                  <a href="https://twitter.com/kriptonian8" target="_blank"><p className="text-[#727576] text-xs">@kriptonian8</p></a>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex justify-center items-center h-[48px] w-[48px] rounded-full border-[#3a3e41] border-solid border-[2px] bg-gradient-to-br from-[#181c20] to-[#282d31]">
                  <Image src="./rajdip.svg" height={36} width={36} alt="sawan_bhattacharjee"></Image>
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-white text-sm">rajdip-b</p>
                  <a href="https://twitter.com/RajB47" target="_blank"><p className="text-[#727576] text-xs">@RajB47</p></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
