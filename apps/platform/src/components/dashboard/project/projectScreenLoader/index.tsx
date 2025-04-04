import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectScreenLoader() {
  return (
    <div className="bg-background dark h-full p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            className="flex h-[7rem] items-center space-x-4 rounded-xl bg-white/5 p-4"
            // eslint-disable-next-line react/no-array-index-key -- since this is a skeleton, using index as key is acceptable
            key={i}
          >
            <Skeleton className="h-12 w-12 rounded-full bg-white/15" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[60%] bg-white/15" />
              <Skeleton className="h-4 w-[80%] bg-white/15" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-2 w-2 rounded-full bg-white/15" />
              <Skeleton className="h-2 w-2 rounded-full bg-white/15" />
              <Skeleton className="h-2 w-2 rounded-full bg-white/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
