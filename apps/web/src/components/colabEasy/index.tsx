import { GeistSans } from 'geist/font/sans'
import {
  ApprovalSVG,
  CustomrollSVG,
  DiscussSVG,
  WebhookSVG
} from '@public/sectionsvg'
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

      <div className="flex gap-x-5">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium">Webhook Alerts</h3>
            <span className="text-base text-[#9394A1]">
              Receive Real-Time Alerts on your Favourite Collaboration Tool
            </span>
          </div>
          <WebhookSVG />
        </Card>
        <div className="flex flex-col gap-y-5">
          <div className="flex gap-x-5">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium">Custom Roles</h3>
                <span className="text-base text-[#9394A1]">
                  Fine-tune Permissions, for allocated Team Members
                </span>
              </div>
              <CustomrollSVG className="w-[25vw] translate-x-[2vw]" />
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium">Discussion & Notes</h3>
                <span className="text-base text-[#9394A1]">
                  Collaborate on Secrets and Changes within your Organisation
                </span>
              </div>

              <DiscussSVG />
            </Card>
          </div>
          <Card widthFull>
            <div className='inline-flex items-center'>
              <div className="flex flex-col w-[40%] p-6">
                <h3 className="flex text-lg font-medium">Approval before Commit</h3>
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
      </div>
    </section>
  )
}

export default ColabEasy
