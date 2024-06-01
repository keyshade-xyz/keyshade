import Image from 'next/image'
import gridImage from '@public/pricing/grid.png'
import {
  ProjectSVG,
  UserSVG,
  DividerSVG,
  SupportSVG,
  TickSVG
} from '@public/pricing'

interface CardProps {
  title: string
  description: string
  price: number

  is_popular: boolean

  space_projects: number
  space_users: number
  space_email_support: boolean
  space_live_support: boolean

  misc_features: string[]
}

function priceCard(card: Readonly<CardProps>): React.JSX.Element {
  return (
    <div
      className="border-1 border-brandBlue/30 hover:border-brandBlue/50 relative flex w-[20rem] flex-shrink-0 flex-col rounded-2xl border border-opacity-5 p-5 text-start md:w-[14rem] lg:w-[17rem]"
      style={{
        background:
          ' linear-gradient(180deg, rgba(37, 45, 63, 0.00) 0%, #252D3F 100%), #252D3F'
      }}
    >
      {/* // TODO: add most popular implementation */}

      <Image
        alt="grid image"
        className="absolute left-[8px] top-[8px] h-[108.39px] w-[246px]"
        src={gridImage}
      />

      <div className="text-brandBlue/90 text-xl font-bold sm:text-2xl md:w-auto md:text-3xl">
        {card.title}
      </div>

      <div className="text-brandBlue/80 mt-1 text-sm sm:mt-2 md:text-base">
        {card.description}
      </div>

      {card.price === 0 ? (
        <div className="mt-2 text-xl text-white/80 sm:mt-4 sm:text-3xl">
          Free
        </div>
      ) : (
        <div className="mt-2 flex flex-row items-end justify-start gap-1  text-sm sm:mt-4">
          <div className="text-xl text-white/80 md:text-3xl">${card.price}</div>
          <div className="text-brandBlue/80 mb-1 text-sm font-light sm:font-normal">
            /month
          </div>
        </div>
      )}

      <button className="border-1 border-brandBlue/80 hover:border-brandBlue/90 bg-brandBlue/30 mb-2 mt-3 h-8 w-28 rounded-full bg-gradient-to-r text-white/70 hover:text-white/80 md:mt-4 md:w-32">
        {card.price === 0 ? 'Get Started' : 'Try For Free'}
      </button>

      <div className="my-5 md:-mx-6 lg:-mx-4">
        <DividerSVG className="w-full" />
      </div>

      <div className="text-brandBlue/90 text-sm font-light tracking-widest md:text-base">
        SPACE
      </div>

      <div className="flex flex-col space-y-2">
        <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
          <ProjectSVG />
          <div>{card.space_projects} Projects</div>
        </div>

        <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
          <UserSVG />
          <div>{card.space_users} Users </div>
        </div>

        <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
          <SupportSVG />
          {card.space_live_support ? (
            <div> Email & Live Support</div>
          ) : (
            <div> Email Support</div>
          )}
        </div>
      </div>

      <div className="text-brandBlue/90 mt-5 text-sm font-light tracking-widest md:text-base">
        RESEARCH
      </div>

      <div className="mt-2 flex flex-col space-y-2">
        {card.misc_features.map((feature) => (
          <div
            className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm"
            key={feature}
          >
            <div>
              <TickSVG />
            </div>
            <div>{feature}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default priceCard
