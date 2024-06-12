---
description: Get to know how you can run the web package!
---

## Running the Web Package

The Web Package resides in the `apps/web` directory. It is powered by NextJS and TypeScript. To run the Web Package locally, do the following:

* In the project root, set up the web app for development with:

```
pnpm dev:web
```

* Or cd into `apps/web` and run:

```
pnpm dev
```

## Testing your code

We use Jest for testing.

To run tests, use this command:

```
turbo run test --filter=web
```

## Viewing the Web App

* You can view the web app by opening the http://localhost:6969 URL in a browser.


