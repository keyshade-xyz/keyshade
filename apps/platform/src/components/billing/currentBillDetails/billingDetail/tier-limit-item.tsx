import { Progress } from '@/components/ui/progress'

interface TierLimitItemProps {
  label: string
  current: number
  max: number
  className?: string
}

export default function TierLimitItem({
  label,
  current,
  max,
  className = ''
}: TierLimitItemProps) {
  const percentage = ((current) / (max)) * 100

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <p className='text-sm font-medium'>
        {current} / {max} {label}
      </p>
      <Progress value={percentage} />
    </div>
  )
}