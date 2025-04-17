import { cn } from '@/lib/utils'

interface WarkingCardProps {
  className?: string
  children: React.ReactNode
}

export default function WarningCard({ className, children }: WarkingCardProps) {
  return (
    <p
      className={cn(
        'rounded-lg border border-yellow-300 bg-yellow-300/5 p-4 text-sm text-white/50',
        className
      )}
    >
      {children}
    </p>
  )
}
