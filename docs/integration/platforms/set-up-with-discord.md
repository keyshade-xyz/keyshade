---
description: Add docs under Integrations section to use Discord with Keyshade
---

# Set up Keyshade with Discord

**Keyshade** can integrate with Discord to send real-time notifications to your server about secret updates, configuration changes, and integration events. This keeps your engineering or operations team in sync and ready to respond to changes.

This guide walks you through how to create a Discord webhook and set up a Keyshade integration to send events to your Discord server.

> Prefer to dive straight? Jump to [Configure the Discord Integration](#configure-keyshade-integration)

## Coming Up

Here's what this guide covers:

- [Create a Discord Webhook URL](#create-a-discord-webhook-url)
- [Create a Discord Integration in Keyshade](#configure-keyshade-integration)
- [Test the Integration](#test-the-integration)
- [Best Practices and Troubleshooting](#best-practices-and-troubleshooting)

> If you're not familiar with how Keyshade works, check out [What is Keyshade?](/docs/getting-started/)

---

## Create a Discord Webhook URL

Keyshade sends messages to Discord using [Incoming Webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks). You'll need to generate a webhook URL for the channel where notifications should appear.

### Step 1: Open Discord Server Settings

- Right-click your **Discord server name** and click **"Server Settings"**
- In the left sidebar, go to **"Integrations"**
- Click on **"Webhooks"**

---
![Where to copy the Webhook URL](https://i.postimg.cc/sD7hCy14/Keyshade-Discord-integration-step-2.png)

### Step 2: Create a New Webhook

- Click **“New Webhook”**
- **Name**: Enter a name like `Keyshade Bot`
- **Channel**: Choose the channel you want Keyshade to post in (e.g., `#keyshade-notify`)
- Optionally, upload an avatar for the webhook (e.g., Keyshade logo)
- Click **“Copy Webhook URL”**
- **Save this URL** — you’ll need it for the next step

---

## Configure Keyshade Integration

### Step 1: Access Integration Settings

- Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)

## Create a Keyshade Project

Before setting up the integration, you need a Keyshade project with your secrets and environment variables.

1. Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)
2. Click **"Create Project"**
3. Name your project (e.g., `my-discord-app`)
4. **Note:** You can skip adding secrets and variables during project creation as we'll add them after setting up the integration

> 💡 **Pro Tip:** Create your Keyshade project first, as you'll need to select it during the integration setup.

![Integration setup Page](https://i.postimg.cc/Cx0fFtqT/Keyshade-Discord-integration-step-1.png)

### Step 2: Configure Discord Integration

- **Integration Name**: Enter a name (e.g., `Keyshade Discord Alerts`)
- **Webhook URL**: Paste the Discord Webhook URL you copied earlier

> We recommend enabling all triggers for complete observability.

- Click **“Save Integration”**
**Event Triggers**  
Select which kinds of events you want to get notified about from the list of available triggers, or choose "Select All Events" for complete coverage.

---

## Test the Integration

### Step 1: Send a Test Message

- After saving, click **“Test Integration”**
- A sample notification will be sent to your Discord channel

### Step 2: Confirm in Discord

- Go to the channel where your webhook was added
- You should see a message like:

  > **Keyshade Integration Test**  
  > This is a test message from your Keyshade Discord integration. Everything is working!

  ![Test Message in Discord](https://i.postimg.cc/jqkXSsxV/Keyshade-Discord-integration-step-3.png)

---

## Best Practices and Troubleshooting

### Common Issues

- **No message in Discord?**
  - Double-check the webhook URL
  - Ensure the channel still exists and is not deleted
  - Try deleting and re-creating the webhook

- **Messages not formatted nicely?**
  - Discord expects JSON payloads with content in a `content` field. Keyshade handles this, but if you see formatting issues, contact Keyshade support.

### Best Practices

1. **Use a dedicated channel** like `#keyshade-alerts` for clarity
2. **Give the webhook bot an avatar** to distinguish it from users
3. **Keep logs enabled** in Keyshade to monitor notification issues
4. **Limit sensitive information** in webhook messages, if needed
5. **Rotate webhook URLs periodically** to reduce exposure risk

**You're All Set 🎊**

_Your Keyshade project is now integrated with Discord for real-time alerts. Whether you're updating secrets or managing config variables, your team stays instantly informed._

> Want to explore more integrations? Head over to the [Integrations Hub](/docs/integrations)
