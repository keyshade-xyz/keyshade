'use client'

import { useState } from 'react'
import { ColorBGSVG } from '@public/hero'
import AnimatedTab from '@/components/ui/animated-tabs'
import PriceCard from '@/components/pricing/card'
import { PriceCardsData, tabsData } from '@/constants/pricing'

function About(): React.JSX.Element {
  const defaultTab = tabsData.find((tab) => tab.default)?.id ?? tabsData[0].id
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  return (
    <div className="relative flex flex-col items-center justify-center ">
      <ColorBGSVG className="absolute -z-10 h-screen w-screen" />

      <div className="pb-4 pt-14">
        <h3 className="w-24 rounded-full border-[1px] border-white border-opacity-[.04] bg-white bg-opacity-5 p-2 text-center text-xs uppercase tracking-widest text-white md:text-sm">
          pricing
        </h3>
      </div>

      <h1 className="text-brandBlue/90 w-[25rem] text-center text-4xl font-extralight md:w-auto md:text-6xl">
        <span className="self-center font-bold tracking-wide">
          Transparent Pricing
        </span>
      </h1>
      <span className="text-brandBlue/80 mt-5 w-[20rem] text-center text-sm md:mt-9 md:w-[35rem] md:text-xl">
        Keyshade combines enterprise-grade capabilities with simplicity offering
        plans tailored to users of all levels.
      </span>
      <div className="mt-8 md:mt-12">
        <AnimatedTab
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabsData}
        />
      </div>
      <div className="flex h-fit w-fit justify-center">
        <div className="mt-10 w-fit md:mt-20 ">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 ">
            {PriceCardsData.map((card) => (
              <PriceCard
                PricingType={activeTab}
                auditlogs={card.auditlogs}
                customRoles={card.customRoles}
                description={card.description}
                isPopular={card.isPopular}
                key={card.title}
                miscFeatures={card.miscFeatures}
                price={card.price}
                snapshots={card.snapshots}
                spaceAccessSpecifier={card.spaceAccessSpecifier}
                spaceEnvironment={card.spaceEnvironment}
                spaceIntegerations={card.spaceIntegerations}
                spaceLiveSupport={card.spaceLiveSupport}
                spaceProjects={card.spaceProjects}
                spaceSecrets={card.spaceSecrets}
                spaceUsers={card.spaceUsers}
                spaceVariables={card.spaceVariables}
                title={card.title}
                versionControl={card.versionControl}
                yearlyPrice={card.yearlyPrice}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
