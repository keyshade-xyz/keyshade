import { GeistSans } from 'geist/font/sans'
import { StandardKitSVG } from '@public/sectionsvg'
import Card from '../shared/card'

function ColabEasy(): React.JSX.Element {
  return (
    <section className="mt-[10vw] flex flex-col items-center gap-y-[9.69rem]">
      <div className="text-brandBlue/80 flex flex-col gap-y-[0.81rem]">
        <h2 className={`${GeistSans.className}  text-center text-5xl`}>
          Collaboration made easy
        </h2>
        <span className="text-center">
          Built for your Seamless Secret Integration
        </span>
      </div>

      <Card>
        <StandardKitSVG />
        <div className="p-6">
          <h3 className="text-lg font-medium">Secret Management Kit</h3>
          <span className="text-base text-[#9394A1]">
            Import, Manage, and Modify Secrets Directly in Your Environment with
            Our SMK
          </span>
        </div>
      </Card>
      <div>
        <Card>
          <StandardKitSVG />
          <div className="p-6">
            <h3 className="text-lg font-medium">Secret Management Kit</h3>
            <span className="text-base text-[#9394A1]">
              Import, Manage, and Modify Secrets Directly in Your Environment
              with Our SMK
            </span>
          </div>
        </Card>
      </div>
    </section>
  )
}

export default ColabEasy
