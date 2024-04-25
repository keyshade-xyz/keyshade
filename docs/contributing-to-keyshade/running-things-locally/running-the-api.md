---
description: Get to know how you can develop the API!
---

# Running the API

The API resides in the `apps/api` directory. It is a NestJS project. To run the API locally, do the following:

* Generate the prisma types:

```bash
pnpm run db:generate-types
```

* Deploy the migrations:

```bash
pnpm run db:deploy-migrations
```

* Start the server in development mode:

```bash
pnpm run dev:api
```

## Testing your code

We currently perform two kinds of tests: **unit tests** and **e2e tests.**&#x20;

After you make sure that you have added your unit tests, or you have made some changes to the existing functionality, you can run them using:

```bash
pnpm run unit:api
```

After this is complete, you can run end-to-end tests to validate your entire application from start to finish. Use this command:

```bash
pnpm run e2e:api
```
