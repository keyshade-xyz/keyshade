import { Skeleton } from "@/components/ui/skeleton"

function ProjectScreenLoader() {
  return (
    <div className="dark min-h-screen bg-background p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[7rem] flex items-center space-x-4 rounded-xl bg-white/5 p-4"
          >
            <Skeleton className="h-12 w-12 rounded-full bg-white/15" />
            <div className="space-y-2 flex-1">
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

export default ProjectScreenLoader