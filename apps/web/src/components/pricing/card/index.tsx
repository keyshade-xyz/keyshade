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
import type { PriceCardPropsType } from '@/types'

function PriceCard({
  title,
  description,
  price,
  yearlyPrice,
  isPopular,
  spaceProjects,
  spaceUsers,
  spaceAccessSpecifier,
  spaceIntegerations,
  spaceSecrets,
  spaceEnvironment,
  spaceLiveSupport,
  miscFeatures,
  PricingType,
  versionControl,
  snapshots,
  customRoles,
  auditlogs,
  spaceVariables
}: Readonly<PriceCardPropsType>): React.JSX.Element {
  const returnButtonLabel = (): string => {
    if (price === 0) {
      return 'Get Started'
    }
    if (price < 0) {
      return 'Contact Us'
    }
    return 'Buy Now'
  }

  return (
    <div className="relative mt-5 md:mt-0">
      {isPopular ? (
        <div className="mt-6 md:mt-0">
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
        </div>
      ) : null}

      <div
        className="border-1 border-brandBlue/30 hover:border-brandBlue/50 relative flex w-[20rem] flex-shrink-0 flex-col rounded-2xl border border-opacity-5 p-5 text-start md:w-[19rem] lg:w-[15rem] xl:w-[18rem]"
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
            <div className="text-xl text-white/80 md:text-3xl">
              {price < 0
                ? 'Custom Pricing'
                : `$${PricingType === 'monthly' ? price : yearlyPrice}`}
            </div>
            {price > 0 ? (
              <div className="text-brandBlue/80 mb-1 text-sm font-light sm:font-normal">
                per user/month {PricingType === 'yearly' && ', billed yearly'}
              </div>
            ) : null}
          </div>
        )}

        <button
          className="border-1 border-brandBlue/80 hover:border-brandBlue/90 bg-brandBlue/30 mb-2 mt-3 h-8 w-28 rounded-full text-white/60 hover:text-white/70 md:mt-4 md:w-32"
          type="button"
        >
          {returnButtonLabel()}
        </button>

        <div className="my-5 md:-mx-6 lg:-mx-4">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#8EE8FF] to-transparent" />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <ProjectSVG />
            <div>
              {spaceProjects < 0 ? 'Unlimited' : spaceProjects} Projects
            </div>
          </div>
          <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>{spaceUsers < 0 ? 'Unlimited' : spaceUsers} Users</div>
          </div>
          <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>
              {customRoles < 0 ? 'Unlimited' : customRoles} Custom Roles
            </div>
          </div>
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>
              {spaceEnvironment < 0 ? 'Unlimited' : spaceEnvironment}{' '}
              Environments
            </div>
          </div>
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>{spaceSecrets < 0 ? 'Unlimited' : spaceSecrets} Secrets</div>
          </div>
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>
              {spaceVariables < 0 ? 'Unlimited' : spaceVariables} Variables
            </div>
          </div>
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>
              {spaceIntegerations < 0 ? 'Unlimited' : spaceIntegerations}{' '}
              Integerations
            </div>
          </div>
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>
              last {versionControl < 0 ? 'Unlimited' : versionControl} versions
            </div>
          </div>
          {snapshots > 0 && (
            <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
              <UserSVG />
              <div>access to {snapshots} snapshots</div>
            </div>
          )}
          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>
              {auditlogs < 0 ? 'Unlimited' : auditlogs} days of audit logs
            </div>
          </div>

          <div className="text-brandBlue/80 mt-3 flex flex-row gap-2 text-sm">
            <UserSVG />
            <div>{spaceAccessSpecifier} Access Specifier </div>
          </div>

          <div className="text-brandBlue/80 mt-1 flex flex-row gap-2 text-sm">
            <div className="flex w-fit">
              <SupportSVG />
            </div>
            <div>{spaceLiveSupport}</div>
          </div>
        </div>

        <div className="text-brandBlue/90 mt-5 text-sm font-light uppercase tracking-widest md:text-base">
          Features
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
