---
description: Get to know how you can run the web app!
---

## Running the Web App

The Web App resides in the `apps/web` directory. It is powered by NextJS and TypeScript. To run the Web App locally, do the following:

* In the project root, run:

```sh
pnpm i
```

Next set up the web app for development with:

```sh
pnpm dev:web
```

* Or cd into `apps/web` and run:

```sh
pnpm dev
```

## Testing your code

We use Jest for testing.

To run tests, use this command:

```sh
turbo run test --filter=web
```

## Viewing the Web App

* You can view the web app by opening the http://localhost:6969 URL in a browser.


