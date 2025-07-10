import { EmptyIntegrationSVG } from '@public/svg/shared'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function EmptyIntegration(): React.JSX.Element {
  const router = useRouter()

  return (
    <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
      <EmptyIntegrationSVG width="120" />

      <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4 pb-10">
        <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
          Declare your first Integration
        </p>
        <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500] text-white/60">
          Sync up your project&apos;s secrets, variables, and environment with
          third-party services
        </p>
      </div>

      <Button
        className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
        onClick={() => router.push('/integrations?tab=overview')}
      >
        Create Integration
      </Button>
    </div>
  )
}
