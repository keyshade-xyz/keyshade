---
description: How to set up Keyshade in a Next.js app for secure runtime secrets — no more .env files.
---

# Set up Keyshade with Next.js

**Keyshade** is a drop-in replacement for `.env` files that manages your secrets and environment variables securely, without needing to commit anything sensitive to your repo.

This guide walks you through integrating Keyshade into your Next.js app step by step.

> Prefer to dive straight into code? Jump to [Installation](/docs/getting-started/installing-the-cli)

## Prerequisites

Before you begin, make sure you've completed the following steps:

- [Installed the Keyshade CLI](/docs/getting-started/installing-the-cli)  
- [Created a profile](/docs/getting-started/setting-up-your-profile) using your API key  
- [Created a workspace, project, and environment](/docs/getting-started/adding-your-first-secret-and-variable) in the Keyshade dashboard  
- [Added at least one secret or variable](/docs/getting-started/adding-your-first-secret-and-variable) to your project

> 💡 If you're not familiar with how Keyshade works, we recommend starting with [What is Keyshade?](/docs/getting-started/introduction)

## Create a Next.js project

If you don't already have a Next.js app, create one using the official CLI.

```bash
npx create-next-app <your-app-name>
```

> Need more options or want to understand what this command does? [Check out the official Next.js documentation](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Install the Keyshade CLI

The Keyshade CLI lets you fetch secrets, inject env variables, and manage profiles all from your terminal.

Install it globally:

```bash
npm install -g @keyshade/cli
```

**Note:** Node.js v24 may cause issues with the Keyshade CLI, so use v20 (LTS) for best compatibility.

> See [Installing the CLI](/docs/getting-started/installing-the-cli) for more info.

## Set up your profile

If this is your **first time using Keyshade**, follow [this guide to set up your profile](/docs/getting-started/setting-up-your-profile).

If you've already used Keyshade before:

```bash
keyshade profile use <your-profile-name>
```

You can verify which profile is active with:

```bash
keyshade workspace list
```

## Create a project and add secrets

Go to the [Keyshade Dashboard](https://app.keyshade.xyz/) and create a new project.

Then, add your secrets (like API keys) and variables (like feature flags or ports).

> 💡 **Secrets vs Variables:**
> **Secrets** are sensitive credentials like API keys or tokens. These are encrypted.
> **Variables** are non-sensitive configs like ports, flags, or feature toggles. These are stored as-is and are not encrypted.   

When adding frontend-exposed values, prefix them with `NEXT_PUBLIC_`.  
See [Next.js docs](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser) for details.

## Initialize Keyshade in your project

From your project root:

```bash
cd <app-name>
```

Run the init command to link your local project with the Keyshade dashboard:

```bash
keyshade init
```

You'll be guided through selecting your workspace, project, and environment.

Want to skip the prompts?

```bash
keyshade init --workspace-slug <my-workspace> --project-slug <my-project> --environment-slug <my-environment> --private-key <my-private-key>
```

This will generate a `keyshade.json` file in your project root.

## Run your app with secure env injection

Start your dev server with Keyshade:

```bash
keyshade run "npm run dev"
```

Keyshade will inject your secrets and variables securely at runtime.

## Access secrets in your code

Once running, your secrets are accessible through `process.env` — just like you're used to.

For example, if you added a variable named `MY_SECRET_KEY` or `NEXT_PUBLIC_API_BASE_URL` in the Keyshade dashboard:

```typescript
// Server-side
const dbToken = process.env.MY_SECRET_KEY;

// Client-side
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

## You're all set 🎊

_Your Next.js app is now securely powered by Keyshade — no `.env` files, no leaking secrets, and no environment mismatches._

<!-- > 🎉 Ready to deploy? Check out [Keyshade with Vercel](/docs/integrations/vercel) for a seamless production setup. -->