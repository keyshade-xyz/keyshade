// generated  by shadcn-ui@latest - shadcn-ui@0.8.0, 08 july 2024 and then modified. 

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
     
      className={cn("animate-pulse rounded-md bg-zinc-700 dark:bg-zinc-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
