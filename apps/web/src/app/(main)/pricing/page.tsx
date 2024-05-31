import AnimatedTab from '@/components/ui/animated-tabs'
import { ColorBGSVG } from '@public/hero'

function About(): React.JSX.Element {
  const tabsData = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly', tag: '-20%', special: true }
  ]

  return (
    <div className="relative flex flex-col items-center justify-center ">
      <ColorBGSVG className="absolute -z-10 translate-y-[20rem]" />

      <div className="pb-4 pt-14">
        <h3 className="w-24 rounded-full border-[1px] border-white border-opacity-[.04] bg-white bg-opacity-5 p-2 text-center text-xs tracking-widest text-white md:text-sm">
          PRICING
        </h3>
      </div>

      <h1
        className={` text-brandBlue/90 w-[25rem] text-center text-4xl font-extralight md:w-auto md:text-6xl`}
      >
        <span className="self-center font-bold tracking-wide">
          Transparent Pricing
        </span>
      </h1>
      <span className="text-brandBlue/80 mt-5 w-[20rem] text-center text-sm md:mt-9 md:w-[35rem] md:text-xl">
        Keyshade combines enterprise-grade capabilities with simplicity offering
        plans tailored to users of all levels.
      </span>
      <div className="mt-8 md:mt-12">
        <AnimatedTab tabs={tabsData} />
      </div>
    </div>
  )
}

export default About
