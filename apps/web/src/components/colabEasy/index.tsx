import { GeistSans } from 'geist/font/sans'
import {
  ApprovalSVG,
  CustomrollSVG,
  DiscussSVG,
  WebhookSVG
} from '@public/sectionsvg'
import Card from '../shared/card'
import { FollowerPointerCard } from '../ui/following-pointer'

function ColabEasy(): React.JSX.Element {
  return (
    <section className="mt-[10vw] flex flex-col items-center gap-y-[5rem] md:gap-y-[9.69rem]">
      <div className="text-brandBlue/80 flex flex-col gap-y-[0.81rem]">
        <h2
          className={`${GeistSans.className}  text-center text-4xl md:text-5xl`}
        >
          Collaboration made easy
        </h2>
        <span className="text-center">
          Built for your Seamless Secret Integration
        </span>
      </div>

      <div className="auto-cols-min  gap-5 space-y-5 md:grid md:space-y-0">
        <Card className="row-span-2">
          <div className="p-6">
            <h3 className="text-lg font-medium">Webhook Alerts</h3>
            <span className="text-base text-[#9394A1]">
              Receive Real-Time Alerts on your Favourite Collaboration Tool
            </span>
          </div>
          <WebhookSVG />
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium">Custom Roles</h3>
            <span className="text-base text-[#9394A1]">
              Fine-tune Permissions, for allocated Team Members
            </span>
          </div>
          <CustomrollSVG className="w-[18rem] translate-x-[8vw] py-12 md:w-[21rem] md:translate-x-[4rem] md:py-0 md:pt-10" />
        </Card>
        <FollowerPointerCard className="col-start-3 col-end-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium">Discussion & Notes</h3>
              <span className="text-base text-[#9394A1]">
                Collaborate on Secrets and Changes within your Organisation
              </span>
            </div>
            <DiscussSVG />
          </Card>
        </FollowerPointerCard>
        <Card className="col-span-2" widthFull>
          <div className="items-center md:inline-flex">
            <div className="flex flex-col p-6 md:w-[40%]">
              <h3 className="flex text-lg font-medium">
                Approval before Commit
              </h3>
              <span className="flex text-base text-[#9394A1]">
                Integrate an additional validation layer to authorise every
                configuration change
              </span>
            </div>
            <div>
              <ApprovalSVG />
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

export default ColabEasy
