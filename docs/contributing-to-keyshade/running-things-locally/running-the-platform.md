---
description: Get to know how you can run the platform app!
---

## Running the Platform

The Platform App resides in the `apps/platform` directory. It is powered by NextJS and TypeScript. To run the Platform App locally, do the following:

* In the project root, run:

```sh
pnpm i
```

Next set up the platform app for development with:

```sh
pnpm dev:platform
```

* Or cd into `apps/platform` and run:

```sh
pnpm dev
```

## Testing your code

We use Jest for testing. Run the tests when unit testing, or mock testing the platform app separately from the rest of the project.

* To run tests in the root, use this command:

```sh
pnpm test:platform
```

## Viewing the Platform App

* You can view the platform app by opening the <http://localhost:3025> URL in a browser.
