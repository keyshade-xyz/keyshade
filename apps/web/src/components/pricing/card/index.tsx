import { Button } from '@/components/ui/moving-border'
import gridImage from '@public/pricing'
import Image from 'next/image'

interface cardProps {
  title: string
  description: string
  price: number

  is_popular: boolean

  space_projects: number
  space_storage: number
  space_email_support: boolean
  space_live_support: boolean

  misc_features: string[]
}

function priceCard(card: cardProps) {
  return (
    <div
      className="border-1 border-brandBlue/30 hover:border-brandBlue/50 relative flex w-[20rem] flex-shrink-0 flex-col rounded-2xl border border-opacity-5 p-5 text-start hover:border-2 md:w-[14rem] lg:w-[17rem]"
      style={{
        background:
          ' linear-gradient(180deg, rgba(37, 45, 63, 0.00) 0%, #252D3F 100%), #252D3F'
      }}
    >
      <Image
        className="absolute left-[8px] top-[8px] h-[108.39px] w-[246px]"
        alt="grid image"
        src={gridImage}
      />

      <div className="text-brandBlue/90 text-xl font-bold sm:text-2xl md:w-auto md:text-3xl">
        {card.title}
      </div>

      <div className="text-brandBlue/80 mt-1 text-sm sm:mt-2 md:text-base">
        {card.description}
      </div>

      {card.price === 0 ? (
        <div className="mt-2 text-sm text-white/80 sm:mt-4 sm:text-3xl">
          Free
        </div>
      ) : (
        <div className="mt-2 flex flex-row items-end justify-start gap-1  text-sm sm:mt-4">
          <div className="text-2xl text-white/80 md:text-3xl">
            ${card.price}
          </div>
          <div className="text-brandBlue/80 mb-1 text-sm font-light sm:font-normal">
            /month
          </div>
        </div>
      )}

      <button className="border-1 border-brandBlue/80 hover:border-brandBlue/90 bg-brandBlue/30 mt-3 h-8 w-28 rounded-full bg-gradient-to-r text-white/70 hover:text-white/80 md:mt-4 md:w-32">
        {card.price === 0 ? 'Get Started' : 'Try For Free'}
      </button>
    </div>
  )
}

export default priceCard
