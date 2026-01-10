import { useRouter } from 'next/navigation'
import { EmptyIntegrationSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'

export default function EmptyIntegration(): React.JSX.Element {
  const router = useRouter()

  const handleCreateIntegration = () => {
    router.push('/integrations?tab=overview')
  }

  return (
    <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
      <EmptyIntegrationSVG width="120" />

      <div className="flex h-20 w-121 flex-col items-center justify-center gap-4 pb-10">
        <p className="h-10 w-121 text-center text-[32px] font-normal">
          Declare your first Integration
        </p>
        <p className="h-6 w-121 text-center text-[16px] font-medium text-white/60">
          Sync up your project&apos;s secrets, variables, and environment with
          third-party services
        </p>
      </div>

      <Button
        className="h-9 rounded-md bg-white text-black hover:bg-gray-300"
        onClick={handleCreateIntegration}
      >
        Create Integration
      </Button>
    </div>
  )
}
