---
description: Start using keyshade in your project
---

# Add keyshade to your project

We would be using a Next.js project to demonstrate the process. First, we will be setting up the project, then we would be using our CLI to tie up keyshade to the project.

## Creating a Next.js project

Create a NextJS app and name it `my-app`. Keep everything to default, and make sure that the app is using TypeScript.

Use this command to create a Next.js project:

```bash
npx create-next-app my-app
```

You can find more info about creating a Next.js project [here](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Updating the entry file

In your `my-app` directory, open the main entry file — typically `app/page.tsx` or `pages/index.tsx` depending on your setup.

Replace its contents with:

```typescript
export default function Home() {
  return (
    <div className="bg-white h-screen w-screen text-center text-black flex flex-col">
      <div><span className="font-bold">Secret (NEXT_PUBLIC_API_KEY):</span> {process.env.NEXT_PUBLIC_API_KEY}</div>
      <div><span className="font-bold">Variable (NEXT_PUBLIC_PORT):</span> {process.env.NEXT_PUBLIC_PORT}</div>
    </div>
  );
}
```

As you can see, we are using 2 environment variables:

- `NEXT_PUBLIC_API_KEY`
- `NEXT_PUBLIC_PORT`

We have not added these in any `.env` file. If you recall, we added these to our project in the [Adding your first secret and variable](/docs/getting-started/adding-your-first-secret-and-variable) section.

## Initializing keyshade in your project

Run the following command to initialize keyshade in your project:

```bash
keyshade init
```

This is an interactive command, and will ask you to input the `workspace-slug`, `project-slug`, `environment-slug` and `private-key` to create the `keyshade.json` file in your project root directory.

You could alternatively run this command to add everything in one line:

```bash
keyshade init --workspace-slug my-workspace --project-slug my-project --environment-slug my-environment --private-key my-private-key
```

You would notice that the `keyshade.json` file has been created in your project root directory. The content would look something like this:

```json
{
  "workspace": "my-workspace-0",
  "project": "my-app-0",
  "environment": "dev-0",
  "quitOnDecryptionFailure": false
}
```

Your project's private key has been added into `~/.keyshade/private-keys.json`. This approach makes it impossible for you to mistakenly commit your private key to your repository.
