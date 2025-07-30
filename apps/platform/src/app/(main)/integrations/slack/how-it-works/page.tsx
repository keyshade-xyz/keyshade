import React from 'react'
import Image from 'next/image'

export default function SlackHowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl py-10 px-6">
      <h1 className="text-3xl font-bold mb-4">How Slack Integration Works</h1>
      <p className="text-white/70 mb-6">
        Integrate Slack with Keyshade to receive real-time alerts about project activity directly in your Slack channels.
      </p>

      <h2 className="text-xl font-semibold mt-6">What It Does</h2>
      <ul className="list-disc ml-6 text-white/60 space-y-2">
        <li>Send event-based notifications to specific channels</li>
        <li>Track errors, deploys, or custom triggers</li>
        <li>Customize which events fire and what payloads are sent</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">Integration Steps</h2>

      <div className="text-white/60 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">1. Create a Slack Webhook</h3>
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
            and create a new app. From the app settings, navigate to &quot;Incoming Webhooks&quot;, enable them, and create a new webhook URL for the desired channel.
          </p>
          <Image
            alt="Step 1"
            height={192}
            src="https://i.postimg.cc/VktHd1TS/Keyshade-Slack-integration-step-1.png"
            width={600}
          />
          <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded">
            [ Screenshot: Slack Incoming Webhooks ]
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">2. Add Integration in Keyshade</h3>
          <p>
            Navigate to the Integrations tab in your Keyshade dashboard, then click &quot;Add Integration&quot;. Choose Slack from the available options.
          </p>
          <Image
            alt="Step 2"
            height={192}
            src="https://i.postimg.cc/7L69SktM/Kayshade-Slack-integration-step-2.png"
            width={600}
          />
          <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded">
            [ Screenshot: Keyshade Add Integration ]
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">3. Configure Integration Settings</h3>
          <p>
            In the configuration form that appears after selecting Slack, you&apos;ll see a field labeled &quot;Webhook URL.&quot; Paste the URL you copied from Slack&apos;s Incoming Webhooks section into this field.
          </p>
          <p>
            Below the URL input, you&apos;ll find a list of available events (like deployment success/failure, error alerts, and custom triggers). Use the checkboxes to select the specific events you want Slack to notify you about.
          </p>
          <p>
            You can also add a custom message prefix, choose a specific emoji icon, or label your alerts for better readability inside Slack.
          </p>
          <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded">
            [ Description: Webhook URL input and event checkboxes in Keyshade ]
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">4. Test Your Integration</h3>
          <p>
            Once configured, click &quot;Test Integration&quot; to send a sample message to your selected Slack channel and verify everything is working as expected.
          </p>
          <div className="bg-white/10 h-48 mt-2 flex items-center justify-center rounded">
            [ Screenshot: Slack Channel with Test Message ]
          </div>
        </div>
      </div>
    </div>
  )
}
