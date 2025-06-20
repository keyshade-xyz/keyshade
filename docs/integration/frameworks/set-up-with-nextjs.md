---
description: A step-by-step guide to integrate Keyshade into your Next.js app for managing secrets and environment variables — no .env files needed.
---

# How to Set Up Keyshade into a Next.js Project

## 1. Create a Next.js Project

Create a new Next.js app and make sure you select TypeScript:

```bash
npx create-next-app my-app
```
You can find more info about creating a Next.js project [here](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 2. Install the Keyshade CLI
Install globally via npm:
```bash
npm i -g @keyshade/cli
```
_Refer: [Installing the CLI](/docs/getting-started/installing-the-cli)_

## 3. Set Up Your Keyshade Profile
If you're using Keyshade **for the first time**, refer: [Setting up your profile](/docs/getting-started/setting-up-your-profile)

If you've **used Keyshade before**, you can simply switch to an existing profile:

```bash
keyshade profile use my-profile
```

Verify your profile is active:
```bash
keyshade workspace list
```

## 4. Create a Project in the Dashboard and Adding Secrets and Variables
_Refer: [Creating a project](/docs/getting-started/adding-your-first-secret-and-variable)_

> 💡 **Secrets vs Variables:**
> 
> -   **Secrets** are sensitive credentials like API keys or tokens.
>     
> -   **Variables** are non-sensitive configs like ports, flags, or feature toggles.
>     

Use `NEXT_PUBLIC_` prefix for any value exposed to the browser as this is a Next.js convention.

You do **not** need to use `.env` or `.env.local`. Keyshade handles that for you at runtime!

## 5. Configure Your Project

Run this in your app directory:

```bash
keyshade init
```

Or skip prompts:

```bash
keyshade init \
  --workspace-slug my-workspace \
  --project-slug my-project \
  --environment-slug dev \
  --private-key my-private-key
```

This will create a `keyshade.json` in the root.

## 6. Run the App

Start your dev server with Keyshade:

```bash
keyshade run "npm run dev"
```

Keyshade will inject your environment values securely.

## You're Done!🎊

_Your app is now configured with secure runtime secrets and variables powered by Keyshade._