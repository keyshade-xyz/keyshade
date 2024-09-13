import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/20 dark:bg-zinc-800',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
