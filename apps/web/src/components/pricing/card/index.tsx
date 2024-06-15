import Image from 'next/image'
import gridImage from '@public/pricing/grid.png'
import {
  ProjectSVG,
  UserSVG,
  SupportSVG,
  TickSVG,
  StarsLeftSVG,
  StarsRightSVG
} from '@public/pricing'

export interface CardProps {
  title: string
  description: string
  price: number

  isPopular: boolean

  spaceProjects: number
  spaceUsers: number
  spaceLiveSupport: boolean

  miscFeatures: string[]
}

function PriceCard({
  title,
  description,
  price,
  isPopular,
  spaceProjects,
  spaceUsers,
  spaceLiveSupport,
  miscFeatures
}: Readonly<CardProps>): React.JSX.Element {
  return (
    <div className="relative mt-5 md:mt-0">
      {isPopular ? (
        <div className="absolute -mt-[2.2rem] w-full ">
          <div className="item h-[4.5rem] translate-y-[2px] overflow-hidden rounded-xl bg-[#1E3F51] bg-clip-border text-center align-middle">
            <div className="bg h-full w-full bg-gradient-to-b from-[#96D4F8]/5 via-[#96D4F8]/30 to-[#96D4F8]/50">
              <div className="flex items-center justify-evenly pt-1">
                <StarsLeftSVG className="aspect-video w-10" />
                <div className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-xs uppercase text-transparent">
                  Most Popular Plan
                </div>
                <StarsRightSVG className="aspect-video w-10" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="border-1 border-brandBlue/30 hover:border-brandBlue/50 relative flex w-[20rem] flex-shrink-0 flex-col rounded-2xl border border-opacity-5 p-5 text-start md:w-[14rem] lg:w-[17rem]"
        key={title}
        style={{
          background:
            'linear-gradient(180deg, rgba(50, 60, 80, 0.00) 0%, #252D3F 100%), #313e58'
        }}
      >
        <Image
          alt="grid image"
          className=" absolute z-10 -ml-[2rem] -mt-[.5rem] h-[108.39px] w-full"
          src={gridImage}
        />

        <div className="text-brandBlue/90 text-xl font-bold sm:text-2xl md:w-auto md:text-3xl">
          {title}
        </div>

        <div className="text-brandBlue/80 mt-1 text-sm sm:mt-2 md:text-base">
          {description}
        </div>

        {price === 0 ? (
          <div className="mt-2 text-xl text-white/80 sm:mt-4 sm:text-3xl">
            Free
          </div>
        ) : (
          <div className="mt-2 flex flex-row items-end justify-start gap-1  text-sm sm:mt-4">
            <div className="text-xl text-white/80 md:text-3xl">${price}</div>
            <div className="text-brandBlue/80 mb-1 text-sm font-light sm:font-normal">
              /month
            </div>
          </div>
        )}

        <button
          className="border-1 border-brandBlue/80 hover:border-brandBlue/90 bg-brandBlue/30 mb-2 mt-3 h-8 w-28 rounded-full text-white/60 hover:text-white/70 md:mt-4 md:w-32"
          type="button"
        >
          {price === 0 ? 'Get Started' : 'Try For Free'}
        </button>

        <div className="my-5 md:-mx-6 lg:-mx-4">
          <div className="via-ble h-[2px] w-full bg-gradient-to-r from-transparent via-[#8EE8FF] to-transparent" />
        </div>

        <div className="text-brandBlue/90 text-sm font-light tracking-widest md:text-base">
          SPACE
        </div>

        <div className="flex flex-col space-y-2">
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <ProjectSVG />
            <div>{spaceProjects} Projects</div>
          </div>

          <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>{spaceUsers} Users </div>
          </div>

          <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
            <SupportSVG />
            {spaceLiveSupport ? (
              <div> Email & Live Support</div>
            ) : (
              <div> Email Support</div>
            )}
          </div>
        </div>

        <div className="text-brandBlue/90 mt-5 text-sm font-light uppercase tracking-widest md:text-base">
          research
        </div>

        <div className="mt-2 flex flex-col space-y-2">
          {miscFeatures.map((feature) => (
            <div
              className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm"
              key={title + feature}
            >
              <div>
                <TickSVG />
              </div>
              <div>{feature}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PriceCard
