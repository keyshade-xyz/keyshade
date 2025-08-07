---
description: How to integrate Keyshade with Vercel
---

# Set up Keyshade with Vercel

**Keyshade** seamlessly integrates with Vercel to manage your secrets and environment variables securely across all deployment environments, eliminating the need to manually configure environment variables in your Vercel dashboard.

This guide walks you through setting up the Keyshade-Vercel integration step by step.

> Already familiar with Keyshade? Jump to [Setting up the Integration](#create-the-vercel-integration)

## Coming Up

Here's what this guide covers:

- [Deploy your project to Vercel](#deploy-your-project-to-vercel)
- [Create a Keyshade project](#create-a-keyshade-project) with your secrets and variables
- [Set up the Vercel integration](#create-the-vercel-integration) in the Keyshade dashboard
- [Configure Vercel API token and project ID](#gather-vercel-configuration-details)
- [Map Keyshade environments to Vercel environments](#step-4-map-environments)
<!-- - [Redeploy your project](#redeploy-your-vercel-project) with automatic environment variable injection -->

> 💡 If you're not familiar with how Keyshade works, we recommend starting with [What is Keyshade?](/docs/getting-started/introduction.md)

## Prerequisites

Before setting up the integration, ensure you have:

- A Vercel account and a deployed project
- A Keyshade account with a workspace
- Your project's source code ready for deployment

## Deploy Your Project to Vercel

First, deploy your project to Vercel **without** adding environment variables during the deployment process.

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"New Project"**
4. Import your Git repository
5. Configure build settings if needed
6. **Important:** Skip adding environment variables during deployment
7. Click **"Deploy"**

> For detailed deployment instructions, check out the [official Vercel deployment documentation](https://vercel.com/docs/deployments/overview).

## Create a Keyshade Project

Before setting up the integration, you need a Keyshade project with your secrets and environment variables.

1. Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)
2. Click **"Create Project"**
3. Name your project (e.g., `my-discord-app`)
4. **Note:** You can skip adding secrets and variables during project creation; these can be added after the integration is set up.

> 💡 **Pro Tip:** Create your Keyshade project first, as you'll need to select it during the integration setup.

## Gather Vercel Configuration Details

Before creating the integration, you'll need to collect some information from your Vercel dashboard.

### Get Your Vercel API Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. In the upper-right corner of your dashboard, click your profile picture, then select Settings
3. Navigate to **"Tokens"** in the left sidebar
4. Click **"Create Token"**
5. Give your token a name (e.g., `Keyshade Integration`)
6. Choose the appropriate scope (Personal or Team)
7. Set an expiration date
8. Click **"Create"**
9. **Important:** Copy and save the token immediately! You won't be able to see it again

> For more details on API tokens, see the [Vercel API documentation](https://vercel.com/docs/rest-api).

### Find Your Project ID

1. Go to your project in the Vercel dashboard
2. Navigate to **"Settings"** tab
3. In the **"General"** section, you'll find your **Project ID**
4. Copy the Project ID (it starts with `prj_`)

## Create the Vercel Integration

Now you're ready to set up the integration in Keyshade.

### Step 1: Access Integrations

1. Go to your [Keyshade Dashboard](https://app.keyshade.xyz/)
2. Navigate to **"Integrations"** in the sidebar
3. Select **"Vercel"** from the available integrations

### Step 2: Configure Integration Settings

Fill in the integration details:

**Integration Name**
- Give your integration a descriptive name (e.g., `My App Vercel Integration`)
1. Select **"Vercel"** from the available integrations

### Step 3: Configure Integration Settings
**Vercel Configuration**
- **Token:** Paste the Vercel API token you created earlier
- **Project ID:** Enter your Vercel project ID (starts with `prj_`)

### Step 4: Link Keyshade Project

- **Project:** Select the Keyshade project you created earlier
- **Private Key:** If you haven't saved your project's private key in Keyshade, you'll need to provide it here

### Step 5: Map Environments

Map your Keyshade environments to Vercel environments:

**Available Vercel Environments:**

* **Development:** For local development and preview deployments
* **Preview:** For preview deployments (branch deployments)
* **Production:** For production deployments
* **Custom:** For any custom environments you've configured

    > ⚠️ **Note:** Custom environments require a [Vercel Pro or Enterprise plan](https://vercel.com/pricing). If you're on a supported plan, you'll need to manually copy the `environmentId` from your Vercel dashboard.
    >
    > Unlike standard environments (development, preview, production), **Keyshade will prompt you to enter the `environmentId` when selecting a custom environment during integration setup**.
    >
    > Refer to [Vercel’s documentation on custom environments](https://vercel.com/docs/deployments/environments#custom-environments) for guidance on creating and managing them.

**Mapping Examples:**

* Keyshade `development` → Vercel `development`
* Keyshade `staging` → Vercel `preview`
* Keyshade `production` → Vercel `production`

### Step 6: Create Integration

1. Review your configuration
2. Click **"Create Integration"**
3. Wait for the integration to be successfully created

Once the integration is complete, you can **verify that it worked** by visiting your **Vercel project’s Environment Variables** section. You should see a variable named `KS_PRIVATE_KEY`.

> ℹ️ **What is `KS_PRIVATE_KEY`?**
> This value is automatically injected by Keyshade. It's essential for your app to securely access any protected data managed by Keyshade.

If you don’t see the variable or the integration fails, try restarting the setup and double-checking your environment mappings.

## Add Your Secrets and Variables

> 💡 **Secrets vs Variables:**
>
>* **Secrets** are sensitive credentials like API keys or tokens. These are encrypted at rest.
>
>* **Variables** are non-sensitive configs like ports, flags, or feature toggles. These are stored as-is.

Now that the integration is set up, add your secrets and environment variables to your Keyshade project.

1. Go to your Keyshade project dashboard
2. Click the **"Secrets"** tab to add your secrets.
3. Click the **"Variables"** tab to add your variables.

> Example Secrets: `DATABASE_PASSWORD`, `API_KEY`, `STRIPE_SECRET_KEY`
>
> Example Variables: `LOG_LEVEL`, `FEATURE_FLAG_ENABLED`, `NEXT_PUBLIC_API_URL`

<!--## Redeploy Your Vercel Project

After setting up the integration and adding your secrets/variables, trigger a redeployment:

1. Go to your Vercel project dashboard
2. Navigate to the **"Deployments"** tab
3. Click **"Redeploy"** on your latest deployment
4. Or push a new commit to trigger automatic redeployment

Keyshade will automatically inject your environment variables during the deployment process.-->

## Verify the Integration

To confirm the integration is working:

1. Check your Vercel deployment logs for successful environment variable injection
2. Verify that your application can access the environment variables
3. Test your application functionality that depends on the secrets/variables

## Managing the Integration

### Updating Environment Variables

1. Go to your Keyshade project dashboard
2. Update secrets/variables as needed
3. Redeploy your Vercel project to apply changes

### Modifying Environment Mappings

1. Go to **"Integrations"** in Keyshade
2. Find your Vercel integration
3. Right-click and choose **"Edit"** to modify environment mappings
4. Save changes and redeploy

### Removing the Integration

1. Go to **"Integrations"** in Keyshade
2. Find your Vercel integration
3. Right-click and choose **"Delete"** to remove the integration
4. Manually add environment variables in Vercel if needed

## Troubleshooting

### Common Issues

**Integration creation fails:**
- Verify your Vercel API token is valid and has the correct permissions
- Ensure the Project ID is correct and matches your Vercel project
- Check that your Keyshade project exists and you have access to it

**Environment variables not injected:**
- Confirm the integration is active and properly configured
- Verify environment mappings are correct
- Check that secrets/variables are added to the correct Keyshade environment
- Ensure you've redeployed after setting up the integration

**Deployment failures:**
- Review Vercel deployment logs for specific error messages
- Verify that all required environment variables are present in Keyshade
- Check for any syntax errors in your environment variable values

### Reach Out to Us

Still stuck? We’re here to help.

* 📧 Email us at: [support@keyshade.xyz](mailto:support@keyshade.xyz)
* 💬 Join our community on [Discord](https://discord.com/invite/mV9PsXsjaH)

Don't hesitate to reach out — we're happy to help with setup, debugging, or general questions.

**You're All Set 🎊**

_Your Vercel deployments are now securely powered by Keyshade — no manual environment variable configuration, no secrets in your repository, and seamless environment management across all deployment stages._

> Using AWS Lambda? Check out our [AWS Lambda Integration Guide](/docs/integration/platforms/set-up-with-aws.md) to securely manage secrets in your serverless functions.