import { Skeleton } from '@/components/ui/skeleton'

export default function OverviewLoader(): React.JSX.Element {
  return (
    <div className="flex h-full w-full gap-[24px]">
      <Skeleton className="flex-1 bg-white/5" />
      <Skeleton className="flex-1 bg-white/5" />
    </div>
  )
}
