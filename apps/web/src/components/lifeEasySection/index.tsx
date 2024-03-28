import { GeistSans } from 'geist/font/sans'
import {
  CommandLineSVG,
  ImportExportSVG,
  SeemlessIntegrationSVG,
  SnapshotSVG,
  StandardKitSVG
} from '@public/sectionsvg'
import Card from '../shared/card'

function LifeEasySection(): React.JSX.Element {
  return (
    <section className="mt-[10vw] flex flex-col items-center gap-y-[9.69rem]">
      <div className="text-brandBlue/80 flex flex-col gap-y-[0.81rem]">
        <h2 className={`${GeistSans.className}  text-center text-5xl`}>
          Making Developers Life Easy
        </h2>
        <span className="text-center">
          Built for your Seamless Secret Integration
        </span>
      </div>

      <div className="grid gap-9 md:grid-cols-3">
        <div className="grid gap-9">
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
          <Card>
            <ImportExportSVG />
            <div className="p-6">
              <h3 className="text-lg font-medium">Import & Export</h3>
              <span className="text-base text-[#9394A1]">
                Import Data from External Platforms and Export to Share or
                Backup Your Configurations.
              </span>
            </div>
          </Card>
        </div>
        <Card>
          <div className="flex h-full flex-col justify-between">
            <div className="p-6">
              <h3 className="text-center text-lg font-medium">
                Seamless Integration
              </h3>
              <span className="text-center  text-[#9394A1]">
                Effortlessly Connect and Sync Your Data with Partner Platforms
                to Ensure Enhanced Workflow Efficiency.
              </span>
            </div>
            <SeemlessIntegrationSVG />
          </div>
        </Card>
        <div className="grid gap-9">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium">Command Line Interface</h3>
              <span className="text-base text-[#9394A1]">
                Manage Your Configurations Directly from Your Terminal across
                Multiple OS
              </span>
            </div>
            <CommandLineSVG />
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium">Snapshot</h3>
              <span className="text-base text-[#9394A1]">
              Capture &quot;Pictures&quot; of Your Entire Workspace for Easy Restoration at Any Time.
              </span>
            </div>
            <SnapshotSVG />
          </Card>
        </div>
      </div>
    </section>
  )
}

export default LifeEasySection
