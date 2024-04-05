import { GeistSans } from 'geist/font/sans'
import { GithubSVG, GoogleSVG, KeyshadeBigSVG } from '@public/svg/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthPage(): React.JSX.Element {
  return (
    <main className="flex h-screen items-center justify-center justify-items-center px-4">
      <div className="flex flex-col gap-6">
        <div className="mb-14 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1 className={`${GeistSans.className} text-[2.5rem] font-semibold`}>
            Welcome to Keyshade
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-x-6">
          <Button>
            <GoogleSVG />
          </Button>
          <Button>
            <GithubSVG />
          </Button>
          <Button>
            <GoogleSVG />
          </Button>
        </div>

        <div className="text-center text-white/40">or</div>

        <div className="flex flex-col gap-3">
          <Input placeholder="Enter your mail " type="email" />
          <Button className="w-full">Get Started</Button>
        </div>
        <Button className="w-full" variant="outline">
          Already have an account? Sign In
        </Button>
        <div className="text-center text-xs text-[#808080]">
          By continueing, you acknowledge and agree to our <br />
          Legal Terms and Privacy Policy.
        </div>
      </div>
    </main>
  )
}
