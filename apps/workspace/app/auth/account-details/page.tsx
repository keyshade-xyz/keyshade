import { KeyshadeBigSVG } from '@public/svg/auth'
import { GeistSansFont, NunitoSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthDetailsPage(): React.JSX.Element {
  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col ">
        <div className="mb-12 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1
            className={`${GeistSansFont.className} text-[2.5rem] font-semibold`}
          >
            Almost Done
          </h1>
          <div className="flex w-[15rem] flex-col items-center text-center">
            <span className={GeistSansFont.className}>
              Fill up the rest details and start your way to security
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-y-12 rounded-xl bg-[#191A1C] px-10 py-5 md:px-[7vw] md:py-8 2xl:py-12">
          <div className="space-y-4 md:w-[20vw]">
            <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Your Name
              </span>
              <Input placeholder="Enter your name" />
            </div>
            <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Your Workspace Name
              </span>
              <Input placeholder="Enter your workspace name" />
            </div>
            <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Organization Mail
              </span>
              <Input placeholder="Enter your mail" type="email" />
            </div>
          </div>
          <Button className="w-full">Verify</Button>
        </div>
      </div>
    </main>
  )
}
