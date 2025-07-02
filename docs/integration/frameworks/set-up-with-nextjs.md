---
description: How to set up Keyshade in a Next.js app for secure runtime secrets — no more .env files.
---

# Set up Keyshade with Next.js

**Keyshade** is a drop-in replacement for `.env` files that manages your secrets and environment variables securely, without needing to commit anything sensitive to your repo.

This guide walks you through integrating Keyshade into your Next.js app step by step.

> Prefer to dive straight into code? Jump to [Running Your App](#run-your-app-with-secure-env-injection)

## Coming Up

Here’s what this guide covers:

- Create a Next.js app  
- [Install the Keyshade CLI](/docs/getting-started/installing-the-cli.md)  
- [Set up a profile](/docs/getting-started/setting-up-your-profile.md)   using your API key  
- Create a project and environment in the Keyshade dashboard  
- [Add secrets and runtime variables](/docs/getting-started/adding-your-first-secret-and-variable.md)   
- Link your local project with `keyshade init`  
- Run your app with `keyshade run`  
- Use `process.env` to access values in both frontend and backend code

> 💡 If you're not familiar with how Keyshade works, we recommend starting with [What is Keyshade?](/docs/getting-started/introduction.md)

## Create a Next.js Project

If you don't already have a Next.js app, create one using the official CLI:

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

> See [Installing the CLI](/docs/getting-started/installing-the-cli.md) for more info.

## Set Up Your Profile

To connect your local environment with Keyshade, create or use a profile.

If this is your **first time using Keyshade**, follow [this guide to set up your profile](/docs/getting-started/setting-up-your-profile.md).

If you've already used Keyshade before:

```bash
keyshade profile use <your-profile-name>
```
You can verify which profile is active with:
```bash
keyshade workspace list
```

## Create a Project and Add Secrets

To get started:
1.  Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)
2.  Click **“Create Project”**
3.  Name your project (e.g. `nextjs-app`)
4.  Inside the project, click the **“Secrets”** tab
5.  Add your **secrets** (e.g. `NEXT_PUBLIC_API_URL`)
6.  Add your **variables** (e.g. `PORT`)

> 💡 **Secrets vs Variables:**
>
>* **Secrets** are sensitive credentials like API keys or tokens. These are encrypted.
>
>* **Variables** are non-sensitive configs like ports, flags, or feature toggles. These are stored as-is and are not encrypted.
 
When adding frontend-exposed values, prefix them with `NEXT_PUBLIC_`.

See [Next.js docs](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser) for details. 

> Need help with projects and secrets? See [Managing Secrets & Variables](/docs/getting-started/adding-your-first-secret-and-variable.md)

## Initialize Keyshade in Your Project

In order to use the configurations you just created on the dashboard, you would need to initialize keyshade in your project. This generates the necessary configurations for the CLI to tap into your keyshade project.

From your project root:

```bash
cd <your-app-name>
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

> More on this in the [CLI Reference](/docs/getting-started/installing-the-cli.md)

## Run Your App with Secure Env Injection

Start your dev server with Keyshade:

```bash
keyshade run -- npm run dev
```
Example output:

![Next.js Run](../../../blob/keyshade-nextjs-run.png)

Keyshade will inject your secrets and variables securely at runtime.

## Access Secrets and Variables in Your Code

Once your app is running with `keyshade run`, use `process.env` to access any injected values — no extra setup needed.

For example, if you added a secret named or `NEXT_PUBLIC_API_URL` and a variable named `PORT` in the Keyshade dashboard:

```typescript
// Server-side
const port = process.env.PORT;
  
// Client-side
const  apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Server-side example
You can access `PORT` inside an API route (say `app/api/hello/route.ts`) like this:

![Server-side example](../../../blob/nextjs-guide-server-side-code.png)

Now, visit `http://localhost:3000/api/hello` to confirm the port is being read from your Keyshade secret.

![Server-side Output](../../../blob/nextjs-guide-server-side-output.png)


### Client-side example
Use `NEXT_PUBLIC_API_URL` in your React components at `app/page.tsx`

![Client-side example](../../../blob/nextjs-guide-client-side-code.png)

Now, visit `http://localhost:3000` to see the public API URL rendered in the browser.

![Client-side Output](../../../blob/nextjs-guide-client-side-output.png)


**You're All Set 🎊**

_Your Next.js app is now securely powered by Keyshade — no `.env` files, no leaking secrets, and no environment mismatches._

<!-- > Ready to deploy? Check out [Keyshade with Vercel](/docs/integrations/?/vercel.md) for a seamless production setup. -->