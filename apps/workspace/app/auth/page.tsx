// eslint-disable-next-line import/no-extraneous-dependencies -- This is insatalled
import { GeistSans } from 'geist/font/sans'
import { Button } from '@/components/ui/button'

export default function AuthPage(): React.JSX.Element {
  return (
    <main className="flex justify-center items-center px-4">
      <div className="flex flex-col ">
        <h1 className={`${GeistSans.className} text-[2.5rem] font-semibold`}>Welcome to Keyshade</h1>
        <Button disabled>Get Started</Button>
      </div>
    </main>
  )
}
