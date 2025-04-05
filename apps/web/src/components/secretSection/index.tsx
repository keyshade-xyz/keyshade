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
      'Safeguard sensitive credentials with our automated rotation protocols',
    svg: <SecrectRotationSVG />
  },
  {
    heading: 'Versioning',
    description:
      'Track configuration changes effortlessly, with seamless rollback and detailed analysis ',
    svg: <VersoningSVG />
  },
  {
    heading: 'Role Based Access Control',
    description:
      'Safeguard Your Data with Granular Access Control and Permissions',
    svg: <RoleBaseSVG />
  },
  {
    heading: 'Public Key Encryption',
    description:
      'Utilize Public Key Encryption to Safely Share Secrets Across Your Infrastructure',
    svg: <PublicKeySVG />
  },
  {
    heading: 'Variables',
    description:
      'Store and Manage Non-Sensitive Data for Enhanced Configuration Flexibility.',
    svg: <VairiablesSVG />
  },
  {
    heading: 'Auditing and Alerting',
    description:
      'Stay Informed and Secure with Real-Time Monitoring and Instant Notifications.',
    svg: <AudtingSVG />
  }
]

function SecrectSection(): React.JSX.Element {
  return (
    <section className="mt-[10vw] flex min-h-[50vh] w-full flex-col items-center gap-y-[5rem] p-6 sm:mt-[1vh] md:gap-y-[9.69rem] landscape:mt-[30vh]">
      <div className="text-brandBlue/80 flex flex-col gap-y-[0.81rem]">
        <h2
          className={`${GeistSans.className}  text-center text-4xl md:text-5xl`}
        >
          Secure Your Configurations with Confidence
        </h2>
        {/* <span>Built for your Seamless Secret Integration</span> */}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:gap-9">
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
          );
        })}
      </div>
    </section>
  );
}

export default SecrectSection
