import { GeistSans } from 'geist/font/sans'
import {
  AudtingSVG,
  PublicKeySVG,
  RoleBaseSVG,
  SecrectRotationSVG,
  VairiablesSVG,
  VersoningSVG
} from '@public/sectionsvg'
import Card from '../shared/card'

const cardData = [
  {
    heading: 'Secret Rotation',
    description:
      'Import, Manage, and Modify Secrets Directly in Your Environment with Our SDK',
    svg: <SecrectRotationSVG />
  },
  {
    heading: 'Versioning',
    description:
      'Import, Manage, and Modify Secrets Directly in Your Environment with Our SDK',
    svg: <VersoningSVG />
  },
  {
    heading: 'Role Based Access Control',
    description:
      'Import, Manage, and Modify Secrets Directly in Your Environment with Our SDK',
    svg: <RoleBaseSVG />
  },
  {
    heading: 'Public Key Encryption',
    description:
      'Import, Manage, and Modify Secrets Directly in Your Environment with Our SDK',
    svg: <PublicKeySVG />
  },
  {
    heading: 'Variables',
    description:
      'Import, Manage, and Modify Secrets Directly in Your Environment with Our SDK',
    svg: <VairiablesSVG />
  },
  {
    heading: 'Auditing and Alerting',
    description:
      'Import, Manage, and Modify Secrets Directly in Your Environment with Our SDK',
    svg: <AudtingSVG />
  }
]

function SecrectSection(): React.JSX.Element {
  return (
    <section className="mt-[10vw] flex flex-col items-center gap-y-[9.69rem]">
      <div className="text-brandBlue/80 flex flex-col gap-y-[0.81rem]">
        <h2 className={`${GeistSans.className}  text-center text-5xl`}>
          Secrects
        </h2>
        <span>Built for your Seamless Secret Integration</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3 2xl:gap-9">
        {cardData.map((card, index) => {
          const { heading, description, svg } = card
          return (
            // eslint-disable-next-line react/no-array-index-key -- safe
            <Card key={index}>
              {svg}
              <div className="p-6">
                <h3 className="text-lg font-medium">{heading}</h3>
                <span className="text-base text-[#9394A1]">{description}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default SecrectSection
