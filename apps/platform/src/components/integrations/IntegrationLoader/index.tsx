import { Skeleton } from '@/components/ui/skeleton'

export default function IntegrationLoader(): React.JSX.Element {
  return (
    <div className="flex w-full gap-5 pt-2">
      <div className="flex flex-1 flex-col gap-5">
        <Skeleton className="h-40 rounded-md bg-white/5 p-6" />
        <Skeleton className="h-64 rounded-md bg-white/5 p-6" />
      </div>
      <Skeleton className="flex-1 rounded-md bg-white/5 p-6" />
    </div>
  )
}
