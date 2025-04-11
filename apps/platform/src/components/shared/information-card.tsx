import { cn } from '@/lib/utils'

interface InformationCardProps {
  className?: string
  children: React.ReactNode
}

export default function InformationCard({
  className,
  children
}: InformationCardProps) {
  return (
    <p
      className={cn(
        'rounded-lg border border-sky-300 bg-sky-300/5 p-4 text-sm text-sky-300',
        className
      )}
    >
      {children}
    </p>
  )
}
