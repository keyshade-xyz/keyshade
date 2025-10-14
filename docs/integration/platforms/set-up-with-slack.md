---
description: Add docs under Integrations section to use Slack with Keyshade
---

# Set up Keyshade with Slack

**Keyshade** can integrate with Slack to notify your team in real time about secret changes, configuration updates, or integration events. This is especially useful for maintaining transparency, responding quickly to critical updates, and improving operational awareness.

This guide walks you through how to configure Slack bot credentials and set up Keyshade to send events to your Slack workspace.

> Prefer to dive straight? Jump to [Configure the Slack Integration](#configure-keyshade-integration)

## Coming Up

Here's what this guide covers:

- [Create a Slack App and Get Bot Credentials](#create-a-slack-app-and-get-bot-credentials)
- [Configure a Slack Integration in Keyshade](#configure-keyshade-integration)
- [Test the Integration](#test-the-integration)
- [Best Practices and Troubleshooting](#best-practices-and-troubleshooting)

> If you're not familiar with how Keyshade works, check out [What is Keyshade?](/docs/getting-started/introduction.md)

---

## Create a Slack App and Get Bot Credentials

Keyshade sends notifications to Slack using a Slack App with bot permissions. You’ll need to create a Slack app, assign it proper permissions, and get the bot token, signing secret, and channel ID.

### Step 1: Create a Slack App

- Go to [https://api.slack.com/apps](https://api.slack.com/apps)
- Click **Create New App** > Choose **From scratch**

  ![Create Slack App](https://i.postimg.cc/FRHzBdB7/Untitled.png)

- Enter an **App Name** like `Keyshade Notifier`
- Select your **Workspace**
- Click **Create App**

---

### Step 2: Assign Bot Permissions

- Once you created the app, you are directed to the app dashboard
- In the app dashboard, go to **OAuth & Permissions**
- Under **Bot Token Scopes**, add these scopes (adjust based on Keyshade docs):
  - `chat:write` (to send messages)
  - `channels:read` (to list channels)
  - `groups:read`
  - `im:read`
  - `mpim:read`

![Assign Bot Permissions](https://i.postimg.cc/BQTdzY9w/Keyshade-Slack-integration-step-2.png)

---

### Step 3: Install the App to Your Workspace

- Still under **OAuth & Permissions**, click **Install to Workspace**
- Authorize the app
- After installation, copy the **Bot User OAuth Access Token** (starts with `xoxb-...`)

![Install the app](https://i.postimg.cc/vH7ZvtPG/Keyshade-Slack-integration-step-3.png)

---

### Step 4: Get the Signing Secret

- In your app dashboard, go to **Basic Information**
- Copy the **Signing Secret** (used for request verification)

---

### Step 5: Find the Channel ID

- Open Slack and go to the channel where you want notifications
- Click on the channel name and select **Copy Channel ID** or use Slack developer tools

![Channel ID](https://i.postimg.cc/rsQY8bV8/Keyshade-Slack-integration-step-4.png)

---

## Configure Keyshade Integration

### Step 1: Access Integration Settings

- Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)

## Create a Keyshade Project

Before setting up the integration, you need a Keyshade project with your secrets and environment variables.

1. Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)
2. Click **"Create Project"**
3. Name your project (e.g., `my-slack-app`)
4. **Note:** You can skip adding secrets and variables during project creation as we'll add them after setting up the integration

> 💡 **Pro Tip:** Create your Keyshade project first, as you'll need to select it during the integration setup.

---

### Step 2: Configure Slack Integration in Keyshade

- **Integration Name**: Enter a descriptive name (e.g., `Keyshade Slack Alerts`)
- **Event Triggers**: Select which kinds of events you want to get notified about from the list of available triggers, or choose "Select All Events" for complete coverage.
- **Bot Token**: Paste the Slack bot token (`xoxb-...`) from your Slack app
- **Signing Secret**: Paste the Slack signing secret
- **Channel ID**: Paste the Slack channel ID where messages should be posted
- Click **Continue**

### Select Project and Environments (optional)

- If you don’t select a project: Keyshade will listen for events from the entire workspace
- If you select a project but no environment(s): it will listen for all environments in that project
- If you select a project and one or more environments: it will listen only to those environments of that project

Finally, click **Create Integration**.

---

## Test the Integration

### Step 1: Send a Test Message

- After saving, click **Test Integration**
- A test notification will be sent to your Slack channel

### Step 2: Verify in Slack

- Open your Slack channel
- You should see a message like:

  > **Keyshade Integration Test**  
  > This is a test message from your Keyshade Slack integration. Everything is working smoothly!

- Try adding test variables and secrets, you should see an update in the designated channel

---

## Best Practices and Troubleshooting

### Common Issues

- **No messages in Slack?**
  - Double-check the bot token, signing secret, and channel ID
  - Confirm your Slack app has the required permissions and is installed properly
  - Make sure the bot is invited to the target channel (or the channel is public)
  - Try reinstalling the Slack app to the workspace

- **Too many messages?**
  - Fine-tune event triggers in Keyshade integration settings
  - Create multiple integrations for separate environments or projects

### Best Practices

1. Use dedicated Slack channels like `#keyshade-alerts` to keep notifications organized
2. Enable alerts for critical events such as failed syncs or secret updates
3. Use emojis or tags in messages for better visibility and urgency
4. Combine with other integrations (e.g., AWS Lambda, GitHub) for full observability
5. Rotate your bot tokens and signing secrets periodically for security

---

**You're All Set 🎉**

_Your Keyshade project now sends real-time updates to your Slack workspace through a Slack bot. Stay ahead of secret changes, monitor activities, and keep your team informed effortlessly._

> Want to explore more integrations? Head over to the [Integrations Hub](/docs/integrations)
