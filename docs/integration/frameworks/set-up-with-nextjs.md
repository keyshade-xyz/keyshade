---
description: A step-by-step guide to integrate Keyshade into your Next.js app for managing secrets and environment variables — a drop-in replacement for .env files.
---

# How to Set Up Keyshade into a Next.js Project

## 1. Create a Next.js Project

Create a new Next.js app and make sure you select TypeScript:

```bash
npx create-next-app <your-app-name>
```

You more details, refer to the [Next.js documentation](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 2. Install the Keyshade CLI

Install globally via npm:

```bash
npm i -g @keyshade/cli
```

*Refer: [Installing the CLI](/docs/getting-started/installing-the-cli)*

## 3. Set Up Your Keyshade Profile

If you're using Keyshade **for the first time**, refer: [Setting up your profile](/docs/getting-started/setting-up-your-profile)

If you've **used Keyshade before**, you can switch to an existing profile by running:

```bash
keyshade profile use <profile_name>
```

Verify your profile is active by running:
```bash
keyshade workspace list
```

## 4. Create a Project in the Dashboard and Add Secrets and Variables

*Refer: [Creating a project](/docs/getting-started/adding-your-first-secret-and-variable)*

> 💡 **Secrets vs Variables:**
>
> * **Secrets** are sensitive credentials like API keys or tokens. These are encrypted.
> * **Variables** are non-sensitive configs like ports, flags, or feature toggles. These are stored as-is and are not encrypted.

Here’s your sentence rewritten for clarity and consistency with the rest of the guide:

> Use the `NEXT_PUBLIC_` prefix for browser-exposed values. See the [Next.js convention](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser) for details.

No need to create an `.env` file. Keyshade handles that for you at runtime!

## 5. Configure Your Project

Navigate to your Next.js project directory:

```bash
cd <your-app-name>
```

Then run the Keyshade initialization by running:

```bash
keyshade init
```
Or skip prompts by running:

```bash
keyshade init \
  --workspace-slug <your-workspace-slug> \
  --project-slug <your-project-slug> \
  --environment-slug <your-environment-slug> \
  --private-key <your-private-key>
```

This will create a `keyshade.json` file in the **root of your project**.

## 6. Run the App

Start your dev server with Keyshade:
```bash
keyshade run "npm run dev"
```
Keyshade will inject your environment values securely.

## 7. Accessing Your Secrets and Variables

Once you've run your app, your environment values are available as usual through `process.env`.

For example, if you added a variable named `MY_SECRET_KEY` or `NEXT_PUBLIC_API_BASE_URL` in the Keyshade dashboard:

```typescript
// server-side
const secretKey = process.env.MY_SECRET_KEY;

// client-side
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
```

## You're Done! 🎊

_Your app is now configured with secure runtime secrets and variables powered by Keyshade._