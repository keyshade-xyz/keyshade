import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectScreenLoader(): React.JSX.Element {
  return (
    <div className="bg-background dark h-full">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <div
            className="bg-white/4 flex h-fit flex-col gap-y-6 space-x-4 rounded-lg border border-white/10 p-4"
            // eslint-disable-next-line react/no-array-index-key -- since this is a skeleton, using index as key is acceptable
            key={i}
          >
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex w-[80%] flex-row gap-2 rounded-sm">
                <Skeleton className="min-h-10 min-w-10 bg-white/15" />
                <div className="flex w-full flex-col gap-2">
                  <Skeleton className="min-h-4 rounded-sm bg-white/15" />
                  <Skeleton className="min-h-4 rounded-sm bg-white/15" />
                </div>
              </div>
              <Skeleton className="min-h-6 min-w-6 rounded-sm bg-white/15" />
            </div>
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row gap-x-2">
                <Skeleton className="h-4 w-8 rounded-md bg-white/15" />
                <Skeleton className="h-4 w-8 rounded-md bg-white/15" />
                <Skeleton className="h-4 w-8 rounded-md bg-white/15" />
              </div>
              <Skeleton className="min-h-8 min-w-20 rounded-md bg-white/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
