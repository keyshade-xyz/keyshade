import { Skeleton } from '@/components/ui/skeleton'

export default function VariableLoader(): React.JSX.Element {
  return (
    <div className="bg-night-c border-white/8 rounded-xl border p-4">
      {/* Header Section */}
      <div className="flex w-full items-center justify-between">
        {/* Variable name skeleton */}
        <div className="flex flex-col items-start gap-y-1">
          <Skeleton className="h-6 w-48 rounded-sm" />
        </div>

        {/* Right side icons skeleton */}
        <div className="flex items-center gap-x-3">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="size-4 rounded-sm" />
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-4 flex items-end justify-between">
        {/* Badges skeleton */}
        <div className="flex gap-x-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Last updated info skeleton */}
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-4 w-24 rounded-sm" />
        </div>
      </div>
    </div>
  )
}
