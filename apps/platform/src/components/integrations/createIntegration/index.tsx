"use client"
import Image from 'next/image'
import React, { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { ArrowLeftRight, CheckSquare2 } from 'lucide-react'
import { Integrations } from '@keyshade/common'
import { KeyshadeBigSVG } from '@public/svg/auth'
import IntegrationIcon from '../integrationIcon'
import SetupIntegration from '../integrationSetup'
import { formatText } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { createIntegrationTypeAtom, createIntegrationOpenAtom } from '@/store'

function CreateIntegration(): React.JSX.Element {
  const integrationType = useAtomValue(createIntegrationTypeAtom)
  const setCreateIntegrationModelOpen = useSetAtom(createIntegrationOpenAtom)

  const [setupModelOpen, setSetupModelOpen] = useState<boolean>(false)
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false)

  if (!integrationType) {
    return (
      <div className="text-center text-gray-500">No integration selected</div>
    )
  }
  const integrationName = formatText(integrationType)
  const integrationConfig = Integrations[integrationType]

  const integrationPermissions =
    integrationConfig.events?.map(
      (group) => `Get notified about ${group.name.toLowerCase()}`
    ) || []

  const _handleClose = () => {
    setCreateIntegrationModelOpen(false)
  }

  const handleNext = () => {
    setSetupModelOpen(true)
  }

  const handleHowItWorks = () => {
    setHowItWorksOpen(true)
  }

  const handleSetupOpenChange = (open: boolean) => {
    setSetupModelOpen(open)
    if (!open) {
      setCreateIntegrationModelOpen(false)
    }
  }

  const handleHowItWorksOpenChange = (open: boolean) => {
    setHowItWorksOpen(open)
  }

  return (
    <div>
      <Dialog onOpenChange={handleSetupOpenChange} open={!setupModelOpen}>
        <DialogContent className="max-w-md bg-[#18181B] text-white">
          <DialogHeader className="flex flex-col items-center justify-between gap-5 pb-4">
            <div className="flex w-full items-center justify-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <KeyshadeBigSVG height="55" viewBox="0 0 130 120" width="55" />
              </div>
              <ArrowLeftRight className="h-6 w-6" />
              <IntegrationIcon
                className="h-[4.5rem] w-[4.5rem] p-4"
                type={integrationType}
              />
            </div>
            <DialogTitle>
              <div className="flex flex-col items-center justify-center text-center">
                <h2 className="mb-2 text-xl font-semibold">
                  Integrate Keyshade with {integrationName}
                </h2>
                <p className="text-sm text-gray-400">
                  Connect Keyshade with {integrationName} to send real-time
                  project updates directly to your server.
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3 border-y border-white/20 py-4">
              <h3 className="text-sm font-medium">Keyshade would do</h3>
              <div className="space-y-2">
                {integrationPermissions.map((permission) => (
                  <div className="flex items-center gap-2" key={permission}>
                    <CheckSquare2 className="h-4 w-4" />
                    <span className="text-sm text-white/60">{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button onClick={handleHowItWorks} variant="secondary">
                How it works
              </Button>
              <Button onClick={handleNext} variant="secondary">
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SetupIntegration
        integrationName={integrationName}
        integrationType={integrationType}
        onOpenChange={handleSetupOpenChange}
        open={setupModelOpen}
      />

      {/* How It Works dialog */}
      <Dialog onOpenChange={handleHowItWorksOpenChange} open={howItWorksOpen}>
        <DialogContent className="max-w-3xl bg-[#18181B] text-white">
          <DialogHeader>
            <DialogTitle>How It Works: {integrationName} Integration</DialogTitle>
            <DialogClose asChild />
          </DialogHeader>

          {/* Slack How It Works content embedded inline */}
          {integrationType === 'SLACK' ? (
            <div className="mt-4 space-y-6 text-sm text-white/80 max-h-[60vh] overflow-auto px-2">
              <p className="mb-6 text-white/70">
                Integrate Slack with Keyshade to receive real-time alerts about project activity directly in your Slack channels.
              </p>

              <h2 className="text-lg font-semibold mt-6">What It Does</h2>
              <ul className="list-disc ml-6 text-white/60 space-y-2">
                <li>Send event-based notifications to specific channels</li>
                <li>Track errors, deploys, or custom triggers</li>
                <li>Customize which events fire and what payloads are sent</li>
              </ul>

              <h2 className="text-lg font-semibold mt-6">Integration Steps</h2>

              <div className="space-y-6 text-white/60">
                <div>
                  <p>
                    Visit the{' '}
                    <a
                      className="underline"
                      href="https://api.slack.com/apps"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Slack API dashboard
                    </a>{' '}
                  </p>
                </div>

                <div>
                  <h3 className="text-md font-semibold">1. Add Integration in Keyshade</h3>
                  <p>
                    Navigate to the Integrations tab in your Keyshade dashboard, then click &quot;Add Integration&quot;. Choose Slack from the available options.
                  </p>
                  <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded text-white/40 italic select-none">
                    <Image
                      alt="Keyshade dashboard Integrations tab"
                      className="object-contain h-full"
                      height={180}
                      src="https://i.postimg.cc/rpFHpRxg/Keyshade-Slack-integration-step-2.png"
                      width={600}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold">2. Configure Integration Settings</h3>
                  <p>
                    In the configuration form that appears after selecting Slack, you&apos;ll see field&apos;s labeled &quot;Integration name, Select Event Triggers and Slack Configuration.&quot; Give the integration a name, select all, and your prompted to give three tokens.
                  </p>
                  <p>
                    Enter the signing secret from your slack configuration settings, the channel ID where you want to send messages, and the verification token into Bot Token from your Slack configuration settings.
                  </p>
                  <p>
                    You are then prompted to create a project to send updates to, so make a project in the Keyshade web app.
                  </p>
                  <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded text-white/40 italic select-none">
                    <Image
                      alt="Keyshade configuration form for Slack integration credentials part 1"
                      className="object-contain h-full"
                      height={180}
                      src="https://i.postimg.cc/j5dC1QWH/Keyshade-Slack-integration-step-3.png"
                      width={600}
                    />
                  </div>
                  <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded text-white/40 italic select-none">
                    <Image
                      alt="Keyshade configuration form for Slack integration credentials part 2"
                      className="object-contain h-full"
                      height={180}
                      src="https://i.postimg.cc/sxRMfd1r/Keyshade-Slack-integration-step-4.png"
                      width={600}
                    />
                  </div>
                  <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded text-white/40 italic select-none">
                    <Image
                      alt="Keyshade configuration form for Slack integration credentials part 3"
                      className="object-contain h-full"
                      height={180}
                      src="https://i.postimg.cc/VkTLLQHV/Keyshade-Slack-integration-step-5.png"
                      width={600}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold">3. Test Your Integration</h3>
                  <p>
                    Once configured, add test &quot;secrets, variables, and environments&quot; to send a sample message to your selected Slack channel and verify everything is working as expected.
                  </p>
                  <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded text-white/40 italic select-none">
                    <Image
                      alt="Keyshade test integration form for Slack"
                      className="object-contain h-full"
                      height={180}
                      src="https://i.postimg.cc/Y09CCrkT/Keyshade-Slack-integration-step-6.png"
                      width={600}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="p-4 text-white/70">How It Works content coming soon.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateIntegration
