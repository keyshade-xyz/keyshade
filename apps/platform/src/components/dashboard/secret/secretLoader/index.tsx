import { Skeleton } from '@/components/ui/skeleton'

export default function SecretLoader(): React.JSX.Element {
  return (
    <div className=" rounded-xl bg-white/5 p-4">
      <div className="flex justify-between">
        <div className="flex items-center gap-x-6">
          <Skeleton className=" h-6 w-32 rounded" />
          <Skeleton className=" size-6 rounded" />
        </div>
        <div className="flex items-center gap-x-3">
          <Skeleton className=" h-6 w-24 rounded" />
          <Skeleton className=" h-6 w-16 rounded" />
          <Skeleton className=" ml-5 size-4 rounded" />
        </div>
      </div>
    </div>
  )
}
