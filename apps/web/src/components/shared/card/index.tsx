import SpotlightCard from '@/components/ui/spotlight-card'

interface CardProps {
  widthFull?: boolean
  children: React.ReactNode
}

export default function Card({
  children,
  widthFull
}: CardProps): React.JSX.Element {
  return (
    <div
      className={`flex ${widthFull ? 'w-[20rem] md:w-full' : 'w-[20rem] md:w-[25rem]'} h-full flex-col justify-end rounded-2xl backdrop-blur-2xl`}
      style={{
        background:
          'linear-gradient(180deg, rgba(52, 52, 52, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), rgba(17, 18, 27, 0.24)',
        boxShadow:
          '0px 4px 4px 0px rgba(255, 255, 255, 0.15) inset, 0px 0px 68px 0px rgba(255, 255, 255, 0.05) inset'
      }}
    >
      <SpotlightCard>{children}</SpotlightCard>
    </div>
  )
}
